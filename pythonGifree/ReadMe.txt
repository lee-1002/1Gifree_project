#  서버 실행하는 방법 및 새롭게 파일을 받았을 경우 해야하는 과정

# 1. 프로젝트 디렉토리로 이동                  *파일 위치 \pythonGifree          *터미널 실행 명령어:    cd pythonGifree


# 2. 가상 환경(venv) 생성                     *파일 위치 \pythonGifree          *터미널 실행 명령어:    python -m venv venv
# 2.1 정상적으로 생성되면 오른쪽 하단에서 We noticed a new environment has been created. Do you want to select it for the workspace folder? 라고 물어봄.
    -> VSCode가 ‘파이썬 가상환경’을 찾음 이거 이 프로젝트에서 기본으로 써? 라고 묻는 것임. -> Yes 혹은 select 클릭


# 3. 가상 환경 활성화                         *파일 위치 \pythonGifree          *터미널 실행 명령어:    .\venv\Scripts\activate
    -> 주소 앞에 (venv)가 뜨면 가상환경 활성화 성공 
        -> 예시: (venv) C:\Users\User\Desktop\Team-Project\pythonGifree>


# 4. requirements.txt로 패키지 설치           *파일 위치 \pythonGifree          *터미널 실행 명령어:    pip install -r requirements.txt
    -> 설치 시간 오래걸림 1~3분


# 4.1 패키지 설치가 끝나면 아래와 같은 주의가 뜬다.
    [notice] A new release of pip is available: 24.0 -> 25.1.1
    [notice] To update, run: python.exe -m pip install --upgrade pip
    -> 새로운 파이썬용 패키지 설치가 있다는 것이니 굳이 업그레이드 하지 않아도 된다. *pip(Package Installer for Python)
    *단 requirements.txt에 있는 패키지 설치가 자꾸 실패할 경우 해야한다.


# 5. 서버 실행 ->                              *파일 위치 \pythonGifree\fastapi  *터미널 실행 명령어:    uvicorn app:app --host 0.0.0.0 --port 8000
# 5.1 주의점: app.py 파일이 있는 곳으로 이동했을 때 가상환경이 활성화 되어있지 않으면 활성화 시키고 해야함.
    -> 예시: (venv) C:\Users\User\Desktop\Team-Project\pythonGifree\fastapi>


# 가상환경 설정 및 서버 실행만 필요한 경우 3번 -> 5번
# .\venv\Scripts\activate
# uvicorn app:app --host 0.0.0.0 --port 8000


# Python 환경에 설치된 모든 패키지와 그 버전을 저장할 경우
# 가상환경이 켜진 상태에서 requirments.txt가 있는 파일 위치에서 진행할 것.
    -> 예시: (venv) C:\Users\User\Desktop\Team-Project\pythonGifree>     # *파일 위치 \pythonGifree          *터미널 실행 명령어:    pip install -r requirements.txt


# venv 종료해야 하는 경우
# pythonGifree 파일로 이동 "cd pythonGifree"
# venv 실행(이미 실행되고 있어도 재실행) !!!!!!pythonGifree 위치에서 해야함.!!!!!!!
# 터미널에 "deactivate" 입력하면 (venv)가 사라짐.  !!!!!!pythonGifree 위치에서 해야함.!!!!!!!
# 사라지지 않으면 VsCode를 꺼보고 다시 실행해보고 그래도 안되면 담당자에게 물어볼 것.