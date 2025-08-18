---
title: "[나만무 프로젝트 회고] JPA N+1 문제, Fetch Join 말고 다른 해결책은 없을까?"
date: 2025-07-30 17:54:00 +09:00
categories: [KraftonJungle]
tags: [jungle]
pin: true
---

> 이번 글에서는 우리 프로젝트에서 `N+1` 문제가 왜 발생했는지,  
> 팀원이 이를 어떻게 해결했는지, 그리고 내가 직접 개선했더라면 어떤 추가적인 방법을 고려했을지도 함께 정리해보려 한다.

## 우리는 조회만 했는데 서버가 터졌다?!

우리 프로젝트에서도 한 번쯤 들어봤던 `N+1 문제`를 겪었다.  
상품 상세 페이지 하나를 클릭할 때마다 수십, 수백 개 쿼리가 발생했고,  
동시 접속자가 조금만 늘어나도 응답 시간이 10초를 넘겼다.

- 반복문 안에서 Repository 호출
  - 카테고리 수만큼 Product 조회 쿼리 반복 실행
  - 1명의 사용자 요청에도 이미 100번 이상의 쿼리 발생
  - 동시 사용자 1,000명 ➔ DB에 수십만 번의 쿼리가 생성

```java
for (Category category : categoryRepository.findAll()) {
    List<Product> products = productRepository.findTop8ByCategory(category);
}
```

- Lazy 로딩 + 연관 엔티티 접근
  - Product 엔티티만 조회한 상태에서, `Category`나 `Tag`에 접근할 때마다 별도 쿼리 실행
  - 반복문 + Lazy 구조 때문에 쿼리가 눈덩이처럼 늘어남

```java
product.getCategory().getCategoryName();
product.getTags().forEach(...);
```

- Stream 안에서 연관 데이터 접근
  - Stream 내부에서도 지연 로딩이 발생 ➔ 요소 하나당 쿼리 실행
  - 상품 수 x 태그 수 = 수백~수천 번 쿼리 발생

```java
product.getTags().stream() ...
```

단순히 페이지 조회만으로도 수십만 번의 쿼리가 DB로 나가면서, 서버가 버티지 못하는 상황이 발생하였다.  
우리 팀원 중 재홍님께서 성능 개선을 맡아 문제를 해결해주셨다.

---

## 해결 코드와 성능 개선

### 1. Fetch Join으로 연관 엔티티 한 번에 조회

```java
@Query("SELECT p FROM Product p JOIN FETCH p.category LEFT JOIN FETCH p.variants WHERE p.id = :id AND p.deleted = false")
Optional<Product> findByIdWithCategoryAndVariants(@Param("id") Long id);
```

- 상품 상세 정보와 연관된 `Cateogry`, `ProductVariant`를 한 번에 조회
- 개선 효과:
  - Lazy 로딩으로 각 Product마다 추가 쿼리가 나가는 문제 제거
  - 단일 조회 시 쿼리 1번으로 감소

### 2. 여러 ID 기반 조회 시 연관 엔티티 Fetch

```java
@Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.tags LEFT JOIN FETCH p.category WHERE p.id IN :ids AND p.deleted = false")
List<Product> findByIdsWithTags(@Param("ids") List<Long> ids);
```

- 여러 상품 조회 시 각 상품의 태그와 카테고리 접근 시 쿼리 폭발 방지
- 개선 효과:
  - N+1 문제 제거
  - 상품 수 x 태그 수 만큼 나가던 쿼리를 최소화

### 3. DTO 프로젝션으로 필요한 데이터만 조회

```java
@Query("SELECT new com.tryiton.core.product.dto.ProductSummaryDto(p.id, p.productName, p.img1, p.price, p.sale, p.brand, p.wishlistCount, p.createAt, p.category.id, p.category.categoryName) " +
        "FROM Product p WHERE p.deleted = false AND " +
        "(p.category.id = :categoryId OR p.category.parentCategory.id = :categoryId)")
Page<ProductSummaryDto> findSummaryByCategoryHierarchy(@Param("categoryId") Long categoryId, Pageable pageable);
```

- 화면에서 실제로 필요한 데이터만 가져옴
- 개선 효과:
  - 불필요한 전체 엔티티 로딩 제거 ➔ 메모리 사용량 감소
  - 데이터 전송량 감소 ➔ 응답 속도 향상

### 실제 성능 개선 효과

- 응답 시간 : 상세 페이지 요청 17초 ➔ 0.5초 ~ 1초 수준으로 개선
- 동시 접속 : 수천 명 동시 접속에도 서버 부담 감소
- 메모리 사용량 : 전체 엔티티 로딩 최소화로 안정화

---

## 실제 코드 동작 예시 : 상세 페이지 조회 과정

### 1. 사용자의 요청

사용자가 웹사이트에서 특정 상품을 클릭하면  
프론트엔드에서 백엔드의 `getProductDetail` API를 호출한다.

```java
// ProductService.java
@Cacheable(value = "productDetail", key = "'product:' + #productId", unless = "#result == null")
public ProductDetailResponseDto getProductDetail(Long userId, Long productId) {
    // ...
}
```

### 2. 캐시 확인

요청이 들어오면 `@Cacheable` 애너테이션이 가장 먼저 동작한다.

- 캐시 히트(Cache Hit)
  - 동일한 상품 ID로 요청이 들어온 적이 있다면, 데이터베이스에 접근하지 않고 **캐시에 저장된 결과**를 즉시 반환함
- 캐시 미스(Cache Miss)
  - 만약 캐시에 데이터가 없다면, 데이터베이스 조회 로직을 실행

```java
@Cacheable(value = "productDetail", key = "'product:' + #productId", unless = "#result == null")
```

### 3. DB 조회 : Fetch Join으로 쿼리 최적화

캐시 미스가 발생하면, `ProductRepository`를 통해 상품 데이터를 조회한다.

```java
// ProductRepository.java
@Query("SELECT p FROM Product p JOIN FETCH p.category LEFT JOIN FETCH p.variants WHERE p.id = :id AND p.deleted = false")
Optional<Product> findByIdWithCategoryAndVariants(@Param("id") Long id);
```

- JOIN FETCH를 사용해 Product와 연관된 Category, Variants를 한 번에 조회
- Lazy 로딩으로 인해 발생할 수 있는 N+1 쿼리 문제를 방지

### 4. DTO 매핑 : 필요한 데이터만 메모리에 담기

```java
List<ProductVariantDto> variantDto = product.getVariants().stream()
    .map(ProductVariantDto::new)
    .toList();
```

- 조회된 엔티티를 DTO로 반환
- 화면에 필요한 데이터만 가져오므로 불필요한 메모리 사용 최소화
- 이미 DB에서 필요한 데이터를 가져왔기 때문에 추가 쿼리 발생 없음

### 5. 사용자별 추가 처리 : 찜 여부 확인

로그인한 사용자라면, 찜 여부를 확인하는 추가 로직을 수행한다.

```java
boolean liked = userId != null &&
    wishlistRepository.existsByUserIdAndProductId(userId, productId);
```

- 이미 DTO로 가져온 상품 데이터와 별개로 처리되므로, 쿼리 폭발의 원인이 되지 않는다.

### 6. 최종 응답 : DTO로 전달

모든 처리가 완료되면 `ProductDetailResponseDto`를 생성해 프론트엔드로 반환한다.  
이 결과는 다음 요청을 위해 캐시에 저장된다.

```java
return new ProductDetailResponseDto(product, variantDto, liked);
```

#### [전체 코드]

```java
// ProductDetailController.java
@GetMapping("/{productId}")
public ProductDetailResponseDto getProductDetail(
        @AuthenticationPrincipal CustomUserDetails customUserDetails,
        @PathVariable Long productId) {

    // 비로그인 사용자인 경우 userId를 null로 처리
    Long userId = (customUserDetails != null)
            ? customUserDetails.getUser().getId()
            : null;

    return productService.getProductDetail(userId, productId);
}
```

```java
// ProductService.java
@Cacheable(value = "productDetail", key = "'product:' + #productId", unless = "#result == null")
public ProductDetailResponseDto getProductDetail(Long userId, Long productId) {

    Product product = productRepository.findByIdWithCategoryAndVariants(productId)
            .orElseThrow(() -> new BusinessException(
                    HttpStatus.NOT_FOUND,
                    "ID " + productId + "에 해당하는 상품을 찾을 수 없습니다."
            ));

    boolean liked = (userId != null) &&
            wishlistRepository.existsByUserIdAndProductId(userId, productId);

    List<ProductVariantDto> variantDto = product.getVariants().stream()
            .map(ProductVariantDto::new)
            .toList();

    if (userId != null) {
        recommendBehaviorLogService.logUserAction(userId, productId, RecommendAction.CLICK);
    }

    return new ProductDetailResponseDto(product, variantDto, liked);
}
```

```java
// ProductRepository.java
@Query("""
    SELECT p
    FROM Product p
    JOIN FETCH p.category
    LEFT JOIN FETCH p.variants
    WHERE p.id = :id AND p.deleted = false
""")
Optional<Product> findByIdWithCategoryAndVariants(@Param("id") Long id);
```

---

## 🤔 N + 1 문제 해결, 다른 방법은 없었을까?

**`default_batch_fetch_size`**와 **`No Offset`** 페이징의 조합

### 1. `default_batch_fetch_size`

- 설정: `application.yml` 파일에 단 한줄을 추가하면 된다.

```yaml
# application.yml
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 100 # 지연 로딩 시 100개씩 IN 쿼리로 묶어 조회
```

- 동작 방식

이 설정을 사용하면, JPA는 지연 로딩 시 1개의 쿼리를 날리는 대신, 설정된 크기만큼 `IN`절을 사용해 한꺼번에 조회한다.  
100개의 상품을 조회할 때 101번의 쿼리가 아닌, 2번의 쿼리로 줄어드는 효과를 얻을 수 있다.

### 2. `No Offset` 페이징 : 대용량 데이터의 구원자

`No Offset` 페이징은 대규모 데이터베이스에서 페이징 성능을 극대화하는 방법이다.

- 해결방안 : `No Offset` 방식은 마지막으로 조회한 데이터의 ID를 기준으로 다음 페이지를 조회함
  - `ORDER BY id`와 `WHERE id > :lastId`를 사용해 전체 데이터를 스캔하지 않고도 빠르게 원하는 지점부터 조회할 수 있다.

```java
@Query("SELECT p FROM Product p WHERE p.id > :lastId AND p.deleted = false ORDER BY p.id ASC")
List<Product> findNextProducts(@Param("lastId") Long lastId, Pageable pageable);
```

### 두 방식의 강력한 시너지 효과

**1. 성능**

우리 프로젝트는 상품 데이터가 **219,000**개에 달했다.  
`No Offset` 덕분에 수십만 개의 데이터가 있어도 페이징 성능이 일정하게 유지된다.  
(마지막으로 본 상품의 ID를 기준으로 다음 데이터를 바로 찾기 때문)

또한, `default_batch_fetch_size` 덕분에 연관 엔티티를 조회할 때도 쿼리 폭발이 발생하지 않는다.

**2. 코드 단순성**  
`Fetch Join` 처럼 복잡한 쿼리를 작성할 필요 없이, 간단한 쿼리와 설정만으로 성능 최적화가 가능하다.

```java
// 서비스 레이어: 매우 단순
public ProductPageResponse getProducts(ProductPageRequest request) {
    List<Product> products = productRepository.findNextProducts(request.getLastId(), PageRequest.of(0, request.getSize()));

    // 이 시점에서 default_batch_fetch_size 덕분에 N+1 걱정 없이 연관 데이터를 로딩
    List<ProductDto> productDtos = products.stream()
        .map(product -> ProductDto.builder()
            .id(product.getId())
            .name(product.getProductName())
            .categoryName(product.getCategory().getCategoryName()) // 배치로 조회
            .build())
        .collect(Collectors.toList());

    // ... 반환 로직
}
```

<br>

## 왜 우리 프로젝트에 적용하지 않았을까?

**1. 명시적 성능 제어**

당장 서버가 터지는 긴급한 상황에 처해 있었고, 어떤 쿼리가 병목 현상을 일으키는지 명확히 파악하고 **해당 쿼리만 집중적으로 최적화**하는 `Fetch Join`이 더 적합했다.

**2. DTO 프로젝션과의 시너지**

`default_batch_fetch_size`는 엔티티 전체를 로딩하기 때문에, DTO 프로젝션이 주는 **메모리 효율성**을 얻기 어렵다. 우리 프로젝트는 화면에 필요한 데이터만 가져오는 것을 중요하게 생각했다.

**3. 복잡한 정렬 기준**

`No Offset` 방식은 `id`와 같은 정렬 기준이 필요하다.  
하지만 우리 프로젝트의 상품 목록은 `인기순`, `최신순` 등 여러 기준으로 정렬해야 했기 때문에, 이를 구현하기 위해서는 쿼리가 복잡해지는 문제가 있었다.

---

## 마치며

이 글을 작성하게 된 계기는 한 가지 잊지 못할 경험 때문입니다.

프로젝트 초기에 빠르게 기능을 구현하면서, 저는 사용자에게 상품 목록을 보여줄 때 별다른 고민 없이 **필요한 데이터를 모두 한 번에** 가져오는 방식을 사용했습니다. 프론트엔드에서는 무한 스크롤로 10개씩 끊어 보여주도록 구현했으니 문제가 없을 거라고 생각했습니다.

하지만 예상치 못한 일이 벌어졌습니다. '오~ 기능이 잘 동작하네'하며 화면을 보던 중, 와이파이가 꺼졌는데도 무한 스크롤이 계속되는 것을 발견했습니다. 순간 "와이파이가 끊겼는데도 어떻게 데이터가 계속 보이는거지?"라는 생각에 머리가 띵했습니다.

알고 보니, 저는 **219,000**개에 달하는 전체 상품 데이터를 백엔드에서 모두 받아온 후 프론트에서 10개씩 끊어 보여주는 방식을 사용했던 것입니다.

단순히 조회만 하는 것만으로도 수많은 사용자가 동시에 접속하면 서버가 버티지 못하고 다운될 수 있다는 것을 깨달았습니다.

<br>

우리 팀원 분께서 이 문제를 발견하고 `Fetch Join`과 `DTO 프로젝션`등을 활용해 성능을 개선해주셨습니다.  
그리고 그 결과는 놀라웠습니다. 17초가 걸리던 응답 시간이 1초 미만으로 단축되었고, 사이트의 안정성 또한 눈에 띄게 좋아졌습니다. 이 경험을 통해 성능 최적화는 서비스의 안정성을 책임지는 중요한 부분이라는 것을 몸소 느꼈습니다.

따라서 팀원 분이 해결해주신 문제를 단순히 넘어가지 않고, `만약 나였다면 어떻게 했을까?, 더 나은 방식은 없었을까?`라는 질문을 던지며 저만의 고민을 기록하고 싶었습니다.

이 고민을 통해 다양한 글을 읽으며 다른 해결방식도 알게 되었고, 각각의 장단점도 이해할 수 있었습니다.

<br>

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> 이 글에서 다룬 내용이 무조건 정답이라는 뜻은 아닙니다.  
> 단지 이런 고민을 하고 이렇게도 생각해볼 수 있구나 정도로 읽어주시길 바랍니다.  
> 실제 프로젝트에서는 어떤 방식이 더 옳다고 단정하기 어렵고,  
> 상황에 따라 다를 수 있다고 생각하기 때문입니다.  
> 결국 중요한 건 그 순간 가장 나은 방법으로 문제를 해결하면 되지않을까 생각합니다.  
{: .prompt-info }

<!-- markdownlint-restore -->

---

#### 참고한 블로그 글

- [JPA 조회 성능 개선한 이야기](https://techblog.uplus.co.kr/jpa-%EC%A1%B0%ED%9A%8C-%EC%84%B1%EB%8A%A5-%EA%B0%9C%EC%84%A0%ED%95%9C-%EC%9D%B4%EC%95%BC%EA%B8%B0-2999c9210522)
- [[김영한 JPA활용 2편] 컬렉션 조회 최적화](https://roughroad.tistory.com/428)
- [JPA N+1 문제 및 해결방안](https://jojoldu.tistory.com/165)
- [Spring Batch JPA에서 N+1 문제 해결](https://jojoldu.tistory.com/414)
- [JPA N+1 이슈는 무엇이고, 해결책은 무엇인가요?](https://velog.io/@sweet_sumin/JPA-N1-%EC%9D%B4%EC%8A%88%EB%8A%94-%EB%AC%B4%EC%97%87%EC%9D%B4%EA%B3%A0-%ED%95%B4%EA%B2%B0%EC%B1%85%EC%9D%80-%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80%EC%9A%94)
