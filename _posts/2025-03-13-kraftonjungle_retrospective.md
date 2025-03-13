---
title: "[크래프톤정글 0주차 회고] 이제부터 시작"
date: 2025-03-13 22:53:00 +09:00
categories: [KraftonJungle]
tags: [jungle]
pin: true
---

크래프톤 정글에서 0주차 '정글 입성'은 **팀별 프로젝트**를 진행하는 것이었습니다.

본격적인 정글을 시작하기 전에 서버에 배포하여 돌아가는 프로그램을 만들어야했습니다.  
저희 팀은 `정글에서 살아남기 - 웹 커뮤니티 서비스`를 구현하였습니다.

웹 커뮤니티에 걸맞게 **개발**, **일상**으로 크게 카테고리를 두어서 궁금한 부분, 일상 고민 등등 자유롭게 올릴 수 있는 서비스입니다.

프로젝트를 진행하며 맡았던 역할, 마주쳤던 문제들과 회고록을 작성하고자 합니다.

먼저 저희 팀의 전반적인 프로그램 동작 흐름에 대해 설명하겠습니다.

---

### 프로그램 전체 흐름 구조

![전반적인 프로그램 동작 그림](/assets/img/program_full_flow.jpg)

1. 첫 페이지는 '로그인'페이지  
   1-1) 회원가입이 되어있다 : 바로 로그인 → 로그인 성공시 → '홈' 페이지로 이동  
   1-2) 회원가입이 되어있지 않다 : '회원가입'페이지로 이동

2. '회원가입' 페이지  
   2-1) 이메일, 비밀번호, 닉네임, 크래프톤 정글 기수 선택  
   2-2) 이메일, 비밀번호, 닉네임은 `중복확인` 거쳐야함

3. '홈' 페이지 : 크게 '글쓰기, 개인정보 수정, 게시글 필터링(키워드)' 기능 존재  
   3-1) 프로필 이미지 클릭 → '마이페이지'로 이동  
   3-2) 글쓰기 버튼 클릭 → '글쓰기 페이지'로 이동  
   3-3) 게시된 글 클릭 → '상세페이지'이동 → **글 수정**, **글 삭제** (본인작성글만 가능), 댓글과 대댓글 등록  
   3-4) '로그아웃' 버튼 클릭 → 로그아웃되어 다시 '로그인' 페이지로 이동

<br>

### ERD 다이어그램 (프로그램의 db 구조)

![erd 다이어그램](/assets/img/erd_diagram.png)

---

### Flask, Jinja2를 사용하며 새롭게 알게 된 부분들

저희 팀의 아키텍처는 Flask Jinja2 Bootstrap(**EC2**), mongoDB Atlas(**db**) 였는데요.  
Flask에서 Jinja2 템플릿을 활용해 SSR(`서버 사이드 렌더링`) 구현하는데, 익숙하지않아서 사용하면서 새롭게 알게된 부분들이 있었습니다.

#### 폴더 구조 📂

```
├─JUNGLE_VILLAGE (프로젝트명)
│  ├─📁 routes (`라우팅 관리`)
│  │  ├─📄 __init__.py
│  │  ├─📄 articles.py  # 게시글 관련
│  │  ├─📄 auth.py      # 로그인, 회원가입 관련
│  │─📁static
│  │  │─ 📁css, 이미지 파일
│  ├─📁templates
│  │  │─ 📁index.html
│  │─📁requirements.txt
|  |─📁create_app.py # 블루프린트 등록
│  └─📁run.py
```

- static : css, 이미지 (정적 파일들)
- templates : Jinja2 템플릿 파일인 html
- requirements.txt : 모든 패키지 작성해두어서 팀원들과 버전 일치

**블루프린트**를 등록함으로써, 각 기능별로 분리해 라우트를 해줄 수 있어 유지보수적으로도 좋습니다. 하지만 현재 프로젝트에는 세부적으로 분리되어있지 않고, 크게 (`articles.py`, `auth.py`) 두개로만 분리해뒀기에 `articles.py` 파일 안의 코드 길이는 400줄이 넘어갑니다. 잘 분리해둔다면 각 기능별로 어떻게 라우팅 되고 있는지 보기 편리해져서 사용하는 것을 추천합니다.

#### SSR (Server-Side Rendering)

서버가 `📁templates`내에 있는 html 파일을 렌더링하고 완성된 걸 클라이언트에게 보내서 화면에 표시해주는 방식입니다.

Q. SSR의 장점?

- 서버에서 html 파일을 렌더링한 다음 보내주기에 클라이언트는 받아서 보여주기만 하면 되기 때문에 초기 로딩 속도가 빠르다.

---

### 마주쳤던 문제 (이미지 파일 DB저장)

제가 맡았던 기능 구현은 **글쓰기 페이지, 마이 페이지**였습니다.  
**글쓰기 페이지**에서 이미지 파일들을 올릴 수 있게 해주었는데요.  
최대 5개의 이미지 파일을 MongoDB에 저장하는 로직을 코드로 구현하려고 할 때,  
`어떻게 Mongodb에 이미지를 저장할 것인가?`의 문제를 마주쳤습니다.

Mongodb에 이미지를 직접 저장하는 것이 아니라, 이미지 저장 경로를 DB에 저장해주는 것으로 문제를 해결하였습니다.

```python
#articles.py
@bp.route("/write", methods=["GET", "POST"])
def write():
    if request.method == "POST":
        category = request.form.get("category")
        title = request.form.get("title")
        content = request.form.get("content")
        user_id = get_current_user_id()
        date = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

        #먼저 데이터 저장
        article_data = {
            "title": title,
            "content": content,
            "user_id": user_id,
            "date": date,
            "category": category,
            "images": []  #빈 리스트
        }

        result = articles_collection.insert_one(article_data)
        article_id = str(result.inserted_id)

        article_folder = os.path.join(UPLOAD_FOLDER, article_id)
        os.makedirs(article_folder, exist_ok=True)

        image_paths=[]
        for i in range(5):
            image_file = request.files.get(f"image{i}")
            if image_file and allowed_file(image_file.filename):
                ext = image_file.filename.rsplit('.', 1)[1].lower()
                filename = f"image{i + 1}.{ext}"
                filepath = os.path.join(article_folder, filename)
                image_file.save(filepath)

                image_paths.append(f"/static/article_image/{article_id}/{filename}")

        if image_paths:
            articles_collection.update_one(
                {"_id": result.inserted_id},
                {"$set": {"images": image_paths}}
            )

        return redirect(url_for("articles.index"))

    return render_template("article_write.html")
```

**Q. 그럼 어떤 로직으로 이미지가 db에 저장되나요?**

사용자가 글을 쓰고 '제출하기' 버튼을 누르면 아래와 같은 과정으로 이미지가 저장됩니다.

1. 카테고리(`category`), 제목(`title`), 내용(`content`), 사용자 아이디(`user_id`), 작성날짜(`date`) 정보를 먼저 MongoDB에 저장  
   1-1. 이때 이미지는 `"images": []` 빈 리스트로 저장함 (MongoDB는 빈 리스트는 저장 공간을 차지하지 않는다고 하더라구요)

2. 저장 후, 생성된 게시글의 고유 ID(`article_id`)를 가지고 이미지 저장 폴더 생성  
   각 게시글 마다 고유한 이미지 저장 경로를 가질 수 있음  
    ex) `/static/article_image/67cfb44b8c8918f658c51832/image1.jpg`

3. 업로드 된 이미지 파일 저장  
   3-1. 허용된 확장자(`png, jpg, jpeg`)인지 확인  
   3-2. image1.확장자, image2.확장자의 형식으로 파일명(`filename`) 지정 한 다음에 저장  
   3-3. 저장된 이미지 경로를 리스트(`image_paths`)에 추가

```python
image_paths.append(f"/static/article_image/{article_id}/{filename}")
```

마지막으로 저장된 이미지 경로를 MongoDB에 `update_one()`을 활용하여 **images** 필드를 업데이트

---

### 구현한 화면

그렇다면, 글 작성페이지와 수정 페이지가 어떻게 화면 구현이 되어있는지 보여드리겠습니다.

![write_page](/assets/img/write_page.jpg)   

사용자가 글쓰기 버튼을 클릭해서 '글쓰기 페이지'로 들어오면 다음과 같은 화면이 보이게 됩니다.  
이미지 첨부는 각각 하나씩 첨부해주어야합니다.

![write_edit_page](/assets/img/write_edit.jpg)  

사용자가 글을 쓰고 쓴 글을 수정할때, 보이는 '글쓰기 수정 페이지'인데요.  
수정할 부분은 수정한 후, 수정완료 버튼을 누르게 되면 DB의 값도 수정되어 수정된 글로 잘 보이게 됩니다.

---

### 최종적인 회고 (5개월동안 성장하고 싶은 부분)

첫날부터 생판 처음 보는 팀원분들과 함께 프로젝트부터 들어갔는데, 열정넘치시고 자신이 아는걸 다 설명해주시고 공유해주셨다. 그 과정에서 몰랐던 개념도 알게 되었고, 헷갈리던걸 확실히 알고 가게 되었다. 또한 코드를 직접 작성하고 프로그램이 작동하는걸 보니 뿌듯하기도 했다. 하지만 마냥 순탄하지만 않았다. 로컬에선 잘 돌아가던게 배포한 서버에선 오류가 터지는 경우 등 전혀 처음보는 문제들도 많았다. 그치만 팀원분들과 함께 해결해나갔고 오류없이 잘 작동될때의 성취감은 정말.. 👍

월요일부터 목요일까지 정말 시간이 어떻게 지나가는지 모르게 지나갔던 것 같다. 앞으로의 정글 생활 또한 이러할것이기에 두렵기도 기대되기도 하다.

5개월동안 내가 이 정글에서 성장하고 싶은 부분은 명확하다.

- 기본기에 단단한 사람
- 어떤 문제를 마주쳐도 무서워하지않고 맞설 수 있는 사람
- 팀 협업에 있어 좋은 팀원이 되어줄 수 있는 사람

5개월 후엔 이런 사람이 되어있고 싶다.

강의실을 가다가 만난 훈련생 분께서 정글 과정을 오롯이 즐기고 열심히 한다면 많은걸 얻어갈거라고 지난 기수분께서 그렇게 말해주셨다고 했다. 이분 말씀처럼 5개월 동안 오롯이 정글이 이끌어주는 길을 잘 따라가다보면 어느새 그렇게 성장해있지 않을까 생각한다.
