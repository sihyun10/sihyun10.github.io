---
title: "Chirpy 깃허브 블로그 게시글 작성 Tip"
date: 2024-03-19 23:27:29 +09:00
categories: [Blog]
tags: [github blog]
pin: true
---

저는 **Chirpy** 테마를 사용하고 있으며, 게시글 작성에 있어 도움이 될만한 것들을 소개하고자 합니다.  
Chirpy 테마를 기준으로 설명드리는 것이기에 읽는데에 유의바랍니다.

<br>

### 블로그 글이 올라가는 파일형식

```
├── 📁_posts
│   ├── 📃2024-03-07-Constructor(생성자).md
│   └── 📃2024-03-16-static.md
```

_posts 폴더 안에 `.md`파일을 생성합니다.  
형식은 `YYYY-MM-DD-TITLE.md`으로 작성해야합니다.

#### 기본적으로 게시물(`.md`) 상단에 아래와 같이 작성해주어야 합니다.

```
---
title: TITLE
date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [TOP_CATEGORIE, SUB_CATEGORIE]
tags: [tag]     # TAG names should always be lowercase
pin: true
---
```

- title : 블로그의 제목
- date : 블로그 작성 날짜
- categories : 카테고리
  - 각 게시물의 카테고리는 최대 **2개**의 요소를 포함하도록 설계되어있다
  - ex) `[Blog, wirte]`
- tags : 태그의 요소
  - 태그 이름은 항상 **소문자**로 작성
  - 0개에서 무한대까지 가능하다
- pin : 메인 Home 화면에 게시물 고정
  - 최근 게시물일수록 위로 올라온다
  - Home 화면에 고정시키고 싶지 않다면 생략 or `false` 적어주기


저는 아래와 같은 형식으로 작성하고 있습니다.

```
---
title: "Constructor 생성자에 대해 파헤쳐보자!"
date: 2024-03-08 15:36:00 +09:00
categories: [Study, Java]
tags: [constructor]
pin: true
---
```

---

### 이미지 미리보기

포스트 글을 작성할때, 아래 사진과 같이 글과 함께 이미지를 넣고 싶을때가 있죠.  

![post top image](https://github.com/sihyun10/sihyun10.github.io/assets/92582664/0043b73d-efae-422a-8b66-7a643e5773f3)

아래와 같은 형식으로 작성해주면 됩니다.

```
---
image:
  path: /assets/img/constructor-introduce.jpg
  alt: 객체를 생성할 때, 자동으로 생성자를 호출해 객체를 초기화 시켜준다.
---
```

- path : 이미지 위치(주소)
- alt : 이미지 설명

이미지 설명은 아래 그림과 같이 작성이 됩니다.  
이미지만 올리는게 아닌, 설명도 같이 적고 싶다면 `alt`를 작성하시면 됩니다.  

![image description](https://github.com/sihyun10/sihyun10.github.io/assets/92582664/8ffa6e0f-e280-45ed-b529-1d0cc119316a) 

------------------------------

### 포스트 내에 이미지 넣기  

![image put](https://github.com/sihyun10/sihyun10.github.io/assets/92582664/6f5ff45b-4c6f-4ced-93fa-727e8f53a126)

글을 쓰며, 이미지를 넣고 싶은 경우가 있잖아요.  
그때 사용하는 이미지를 모두 `/assets/img/..` 파일 내에 넣어두면 많아질 것 같았습니다.  
그래서 찾아낸 방법을 공유하고자 합니다.  

<br>

**깃허브 활용하기**  

1) Github Issues 탭에 가서 **New issue**를 클릭   
2) 아래와 같이 저 네모칸에 이미지 넣기    

![issue](https://github.com/sihyun10/sihyun10.github.io/assets/92582664/018705c6-e63f-4566-bb52-1cbe0be68211){: width="972" height="589"}  

3) 그럼 이미지가 업로드 되면서 이미지 주소가 생성됨    

![image link](https://github.com/sihyun10/sihyun10.github.io/assets/92582664/3cb300d3-07a4-4684-9a0f-841016b2921e){: width="972" height="589"}  

4) 이 주소를 복사해 붙여넣기 하면 이미지를 넣을 수 있다  

<br>

**이미지 하단에 글 적기**
```
![img-description](이미지 주소)
_Image Caption_
```
이미지 다음 줄에 `_ _`를 추가하면 이미지 하단에 표시가 된다  


**이미지 사이즈 조절** 은 `{: width="~" height="~"}` 이와 같은 형식으로 적어주면 된다  

```
![image description](이미지 주소){: width="972" height="589"}  
```

**이미지 정렬**을 하고 싶다면   

1) 왼쪽 정렬  
```
![image description](이미지 주소){: width="972" height="589" .w-75 .normal}
```  

2) 글과 함께 이미지 왼쪽 정렬  
*(한글 문서 작성할때, 이미지를 글자처럼 취급하는것과 같다)*  
```
![image description](이미지 주소){: width="972" height="589" .w-50 .left}
```

3) 글과 함께 이미지 오른쪽 정렬  
```
![image description](이미지 주소){: width="972" height="589" .w-50 .right}
```

> 기본적으로 이미지가 중앙에 위치하게 되지만, `Normal, Left, Right` 중 하나를 사용하여 위치를 지정할 수 있다  

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->
> 위치를 지정하게 되면 **이미지 캡션(설명)은 추가하면 안된다**  
{: .prompt-warning }

<!-- markdownlint-restore -->
--------------------

포스트 글을 다 작성하고 나면 Github에 올리기 전 local 환경에서 글이 잘 보이는지, 오류는 없는지 확인해 보아야 합니다.  
글을 작성 후 확인 없이 바로 push 해버리면 어떤 오류가 발생할지 모르는거니까요!  

#### Ruby로 local 실행

1) `Start Command Prompt with Ruby` 실행

![ruby](https://github.com/sihyun10/sihyun10.github.io/assets/92582664/b458661c-bd8c-4e48-8a88-1155faa4034b)  

2) 본인의 블로그 파일 경로로 이동

```
cd C:\Users\USER\Desktop\blog
```

3) 아래 명령어 입력

```
bundle exec jekyll serve
```

위의 명령어를 입력하게 되면 아래처럼 server가 띄워지게 됩니다.  
![ruby server](https://github.com/sihyun10/sihyun10.github.io/assets/92582664/a04d55ff-478f-47e9-9371-55d2527815d5)   

`http://127.0.0.1:4000/`에 접속해 글이 잘 작성되었는지 확인하면 됩니다.

4) `Ctrl + c`를 누르면 서버를 종료시킬 수 있습니다.  
오류없이 블로그가 잘 작동하고, 고칠 글도 없다면 이제 서버 종료 후, Github에 push 해주세요

<br>

#### Visual Studio 터미널에서 local 실행  

1) 터미널을 연다 (Ctrl + `)   
2) 아래 명령어 입력  
```
bundle exec jekyll serve
```

명령어를 입력하게되면 server가 띄워지게 됩니다.   
  

![visual studio server](https://github.com/sihyun10/sihyun10.github.io/assets/92582664/c3fa7d54-0241-4057-b281-8becf5e08336)


그럼 위와 똑같이 `http://127.0.0.1:4000/`에 접속해 글이 잘 작성되었는지 확인하면 됩니다.  

3) `Ctrl + c`를 누르면 서버 종료    
오류없이 블로그가 잘 작동하고, 고칠 글도 없다면 이제 서버 종료 후, Github에 push 해주세요  

--------------------

참고 링크    

- [Chirpy 공식 블로그 글](https://chirpy.cotes.page/posts/text-and-typography/)    

- [위 게시물 깃허브 코드 링크](https://github.com/cotes2020/jekyll-theme-chirpy/blob/master/_posts/2019-08-08-text-and-typography.md?plain=1) 