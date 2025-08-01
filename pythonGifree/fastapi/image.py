from fastapi import APIRouter, File, UploadFile, HTTPException
from google.cloud import vision
import os
import io

# --- 환경 설정 ---
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'vision_key.json'

router = APIRouter()
client = vision.ImageAnnotatorClient()

# ✨ --- 1. 파이썬 코드에 직접 '브랜드 사전' 만들기 ---
# 앞으로 새로운 브랜드를 추가할 때, 여기에만 한 줄씩 추가해주시면 됩니다.
BRAND_MAP = {
    # key: Vision API가 인식하는 영어 이름 (소문자)
    # value: DB에 저장된 한글 이름
    "starbucks": "스타벅스",
    "ediya coffee": "이디야커피",
    "a twosome place": "투썸플레이스",
    "twosome place": "투썸플레이스",
    "bhc": "BHC",
    "kyochon": "교촌치킨",
    "paris croissant":"파리바게뜨",
    # 여기에 계속 브랜드를 추가해주세요.
}

@router.post("/analyze-brand", tags=["Brand Analysis"])
async def analyze_brand_image(file: UploadFile = File(...)):
    print(f"--- 🖼️ 브랜드 분석 요청: {file.filename} ---")
    contents = await file.read()
    image = vision.Image(content=contents)

    try:
        response = client.logo_detection(image=image)
        logos = response.logo_annotations

        if response.error.message:
            raise HTTPException(status_code=400, detail=f"Vision API Error: {response.error.message}")

        if logos:
            top_logo = logos[0]
            original_brand_name = top_logo.description.lower()
            score = top_logo.score

            # 사전(BRAND_MAP)에서 한글 이름 찾
            # .get(key, default) : 사전에 key가 있으면 value를, 없으면 default(원본 영어 이름) 값을 반환
            final_brand_name = BRAND_MAP.get(original_brand_name, original_brand_name)

            print(f"--- ✨ 분석 결과: '{original_brand_name}' -> '{final_brand_name}' (정확도: {score:.2f}) ---")
            return {"brand_name": final_brand_name, "confidence_score": f"{score:.2f}"}
        else:
            print("--- 😭 이미지에서 브랜드를 찾지 못함 ---")
            return {"brand_name": "인식된 브랜드가 없습니다."}

    except Exception as e:
        print(f"--- 🚨 브랜드 분석 중 오류 발생: {e} ---")
        raise HTTPException(status_code=500, detail=f"이미지 분석 중 서버 오류가 발생했습니다: {str(e)}")
