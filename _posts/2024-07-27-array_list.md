---
title: "ArrayList"
date: 2024-07-27 23:26:00 +09:00
categories: [Study, Java]
tags: [arraylist, array, Collection]
pin: true
---

먼저 **Array**(배열) 특징에 대해 알아보자.   

![배열](/assets/img/array.jpg){:style="width:80%; height:auto;"}       

- 배열의 크기를 초기에 **정적**으로 정한다 (정적할당)
  - ex) `Hello[] hi = new Hello[7];`
  - 배열의 크기를 변경하지 못함
  - 따라서 메모리 낭비가 될 수 있으며, 크기가 부족할 수 있음
- 자료를 찾을 때, 인덱스(`index`)를 사용해 빠르게 찾을 수 있다
- 자료 입력, 변경할 때도 한번의 계산으로 위치를 찾아 값을 입력하거나 변경하기에 빠르다
- 자료 검색은 데이터를 하나하나 확인해야하기에 평균적으로 느리다
  - 배열의 크기가 클수록 연산이 많이 필요하기 때문

<br>

#### 배열에 값 추가   

값을 추가하기 위해서는 공간을 확보해주어야 한다.  

1) 배열 **첫번째** 위치에 추가   
`hi[0]` → `0번째` 인덱스를 찾고,   
기존 배열의 값들을 오른쪽으로 이동시킨 후,  
첫번째 위치에 값을 변경한다.   

`O(1) + O(n) = O(n)`  

2) 배열 **중간** 위치에 추가  

중간 위치에 해당하는 인덱스를 찾고,  
기존 배열의 값들을 오른쪽으로 이동시킨 후,   
값을 변경한다.  

`O(1) + O(n/2) = O(n)`  

3) 배열 **끝** 위치에 추가  

끝 위치에 해당하는 인덱스를 찾고,  
값을 변경한다.  
*(마지막 위치이기에 오른쪽으로 이동시킬 데이터가 없어 바로 데이터를 변경시키면 된다)*     

`O(1)`    

----------------------------------------------------------------

배열은 정적할당이어서 배열길이를 동적으로 변경할 수 없다.  
이러한 단점을 해결한 것이 **ArrayList**이다.  

#### ArrayList 특징  

- 리스트 크기가 **동적**이다 (동적할당)  
  - 배열을 copy하여 늘리기때문에 지연이 발생할 수 있음
  - 크기가 부족할때, 자동으로 늘어나니 메모리 낭비가 덜함
- 데이터 사이사이에 빈 값이 없음  
  - 첫번째, 중간 위치에 값을 삭제할때 값들이 이동되기에 느림   
  - 마지막 위치에 삭제는 이동이 없기에 빠름


#### ArrayList 사용법  

- ArrayList 객체 생성

```java
//String 문자열만 보관
ArrayList<Strinig> str = new ArrayList<>();

//초기 크기값 7으로 지정
ArrayList<Strinig> str = new ArrayList<>(7);
```

- 요소 추가  

```java
ArrayList<Strinig> str = new ArrayList<>(7);

str.add("java");
//str.add(1); // 숫자를 입력했기에 컴파일 오류 발생
```  

- 값 조회    
  - get(int index) : index에 해당하는 값을 반환

```java
ArrayList<Strinig> str = new ArrayList<>(7);

str.add("java");
String result = str.get(0);
System.out.println(result);
```

```
//출력결과
java
```

제네릭을 사용하면 타입안전성을 보장받을 수 있다.  
따라서 값 추가하거나 조회할때 내가 원하는 타입으로 안전하게 보장받을 수 있다.  

- 값 변경  
  - set(int index, Object obj)

```java
ArrayList<Strinig> str = new ArrayList<>(7);

str.add("java");
str.set(0, "ArrayList");
```

<br>  

1) 데이터 추가  
 - 마지막 추가 : O(1)
 - 앞, 중간 추가 : O(n)  

2) 데이터 삭제  
 - 마지막 삭제 : O(1)  
 - 앞, 중간 삭제 : O(n)

3) 조회 : O(1)  
4) 검색 : O(n)  

<br>

ArrayList는 앞, 중간에 값을 추가하거나 삭제할때 O(n)으로 느리다.   
데이터 검색도 다 하나씩 일일이 확인해야하기 때문에 느리다.   

하지만, 배열의 특성을 가지기 때문에  
값을 마지막에 추가하거나 삭제할때와 조회할때 빠르다.  
