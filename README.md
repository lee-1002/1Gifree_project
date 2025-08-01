# SpringBoot, React, Python을 이용하고 AWS를 이용해 배포를 한 기프티콘 판매 사이트


## 프로젝트 소개
챗봇과 지역 기반을 더한 기프티콘 거래 플랫폼


## 프로젝트 명 

# Gifree

### 개발 기간

- 25.6.30(월) ~ 25.07.30(수)

## 멤버 


|                    (팀장) [이상원](https://github.com/lee-1002)                    |                     [이용석](https://github.com/LeeYongseok-0000)                     |                      [장준혁](https://github.com/jjh-8249)                     |                      [박지혁](https://github.com/weare2415)                     |
|:-------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------:|
| [<img src="https://avatars.githubusercontent.com/u/183713556?v=4" width="200" />](https://github.com/lee-1002) | [<img src="https://avatars.githubusercontent.com/u/184890981?v=4" width="200" />](https://github.com/LeeYongseok-0000) | [<img src="https://avatars.githubusercontent.com/u/183588723?v=4" width="200" />](https://github.com/jjh-8249) | [<img src="https://avatars.githubusercontent.com/u/177728506?v=4" width="200" />](https://github.com/jihyuk123979) |


------------------------------------------------------------------------------------

### 역할 분담
#### 각 팀원들은 풀스택 기반으로 역할을 수행함
이상원 (팀장)
- 프로젝트 전체 감독 관리
- Spring Security(일반, 소셜 로그인, JWT)
- 회원 Role에 따른 화면 구성 차이(USER, ADMIN)
- 지도 API 위치 기반 서비스
- 결제 API(Payment Gate)로 실제 구매 확인
- 구매 완료된 구매 내역 마이페이지에 담기도록

이용석
- 챗봇 음성 기능으로 구매 API까지 
- 검색창 브랜드 로고 이미지를 넣었을 때 분석해서 해당 브랜드 상품 결과 나오도록 구현 
- 파이썬을 이용한 챗봇(with OpenAPI)
- 기부 페이지 만들고 기부될 상품 마이 페이지 저장, 기부 횟수, 금액 그래프화

장준혁
- 게시판 페이지 페이징, 파일 처리, CRUD
- PDF 작업
- 판매 상품 리스트, 상품 상세 페이지, 상품 등록 구현
- 메인 회면에 할인율과 같은 필터를 넣어 눈에 띄도록

박지혁
- 로컬 가게에 대한 홍보, 이벤트 페이지
- 누적 구매 금액이 일정 금액 이상 쌓이면 랜덤 박스로 판매 중인 상품 당첨 기회 부여
- 팀원들 코드 취합
- 마이 페이지 보관함

------------------------------------------------------------------------------------
## 목차

####  I. 개발 환경

####  II. 주요 기능 & 설명

####  III. 시연 영상

--------------------------------------------------------------------------------------
### 개발환경
- 언어
  
   <img src="https://img.shields.io/badge/java-007396?style=for-the-badge&logo=java&logoColor=white"> 
- 개발 도구
<div>
<img src="https://img.shields.io/badge/springboot-6DB33F?style=for-the-badge&logo=spring&logoColor=white">
<img src="https://img.shields.io/badge/springsecurity-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white">
<br/><img src="https://img.shields.io/badge/react-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/redux-764ABC?style=for-the-badge&logo=redux&logoColor=black">
<img src="https://img.shields.io/badge/python-3776AB?style=for-the-badge&logo=python&logoColor=white">
<br/><img src="https://img.shields.io/badge/html5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
<img src="https://img.shields.io/badge/css-1572B6?style=for-the-badge&logo=css3&logoColor=white">
<img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
<br/><img src="https://img.shields.io/badge/aws-232F3E?style=for-the-badge&logo=amazonwebservices&logoColor=white">
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white">
<br/><img src="https://img.shields.io/badge/Javascript-F7DF1E?style=for-the-badge&logo=Javascript&logoColor=white">
<img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=OpenAI&logoColor=white">
<br/><img src="https://img.shields.io/badge/Google%20Cloud%20API-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white">
<img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=Prettier&logoColor=white">
</div>
- IDE
  
   <img src="https://img.shields.io/badge/Visual%20Studio%20Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white">
- OS
  
   <img src="https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white">
- Sever : AWS

------------------------------------------------------------------------------------

## ERD
<img width="1024" height="787" alt="image" src="https://github.com/user-attachments/assets/1a602e1c-8ea7-47ae-8a1a-c356ed041723" />

------------------------------------------------------------------------------------

## 유스케이스다이어그램
- 전체
<img width="1679" height="592" alt="image" src="https://github.com/user-attachments/assets/4d8b6a7c-693e-4790-8f5b-45ab85f70ff7" />

------------------------------------------------------------------------------------
## 주요 기능

### 로그인
- 회원 가입 정보를 로그인 폼에 입력하면 데이터 베이스에 해당 사용자의 데이터가 있는지 확인하고 로그인 처리되면 메인으로
-  ![gifree 시연영상](https://github.com/user-attachments/assets/afbf2f93-5358-468c-99a7-7d579b6031f1)

### 그래프
- 메인 화면에서 DB에 저장된 회원별 기부 내역을 금액과 횟수 중 궁금한 내용을 검색해서 그래프로 확인할 수 있다.
![gifree 시연영상(그래프)](https://github.com/user-attachments/assets/b115efc9-edf5-429a-8636-93d1758262cd)

### 지도
- 카카오 지도API를 가져와서 내 위치 확인과 주변 가게 상호명, 나와의 직선 거리(가까운 거리 순으로 정렬), 검색창에 브랜드 또는 가게명 입력 시 판매 중인 기프티콘 중 검색한 이름과 같으면 상품도 리스트에 나와서 장바구니에 넣기 가능
![1-ezgif com-speed](https://github.com/user-attachments/assets/75f95081-72c0-460f-97ce-8752f2b9a286)

### 챗봇
- 챗봇에 상품 목록, 구매 내역 등을 입력하면 실시간으로 사용자의 상태를 텍스트로 보여주고 음성 MCP 방식으로 사고 싶은 브랜드의 상품명과 개수를 말하고 사고 싶다고 말하면 결제 API가 나오고 결제까지 완료되도록 구현
![텍스트](https://github.com/user-attachments/assets/de0f72c8-4613-4a2e-908d-9d1d9c8662ae)
![음성](https://github.com/user-attachments/assets/679ec6d7-f09d-400b-89da-6008c1a8103c)

------------------------------------------------------------------------------------
## 시연 영상
https://youtu.be/VKaFFWyrlzs
------------------------------------------------------------------------------------
