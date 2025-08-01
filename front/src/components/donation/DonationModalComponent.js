import React, { useEffect, useState } from "react";
import useCustomLogin from "../../hooks/useCustomLogin";
import { getCookie } from "../../util/cookieUtil";
import axios from "axios";
import { API_SERVER_HOST } from "../../api/backendApi";
import useCustomUserRoles from "../../hooks/useCustomUserRoles";

function DonationModalComponent({ isOpen, onClose }) {
  const { loginState, exceptionHandle, moveToLogin, isLogin, token } =
    useCustomLogin();
  const [brand, setBrand] = useState("");
  const [pname, setPname] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const { isAdmin } = useCustomUserRoles();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 이미지 미리보기 처리
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(imageFile);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  // 개발 및 디버깅을 위해 토큰 값을 확인하는 로그를 추가
  useEffect(() => {
    if (!token) {
      console.warn(
        "경고: 액세스 토큰이 존재하지 않습니다. 로그인 상태를 확인하세요."
      );
      console.log("member 쿠키:", getCookie("member"));
    } else {
      console.log("현재 사용 중인 토큰:", token.substring(0, 30) + "..."); // 토큰의 일부만 출력하여 보안 유지
    }
  }, [token]);

  const handleDonate = async () => {
    console.log("🚀 handleDonate 함수 시작");
    console.log("🚀 isLogin:", isLogin);
    console.log("🚀 token 존재:", !!token);

    setError("");
    setMessage("");

    // 로그인 상태 확인
    if (!isLogin) {
      console.log("❌ 로그인 상태 확인 실패 - moveToLogin 호출");
      setError("로그인이 필요합니다.");
      moveToLogin();
      return;
    }

    // 토큰 재확인
    const currentToken = getCookie("member")?.accessToken;
    if (!currentToken) {
      console.log("❌ 토큰이 없음 - moveToLogin 호출");
      setError("로그인이 필요합니다.");
      moveToLogin();
      return;
    }

    if (!brand || !pname || !price) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      let imageFileName = null;

      // 이미지가 있는 경우 먼저 업로드
      if (imageFile) {
        console.log("📸 이미지 업로드 시작");
        const formData = new FormData();
        formData.append("files", imageFile);

        const uploadResponse = await axios.post(
          `${API_SERVER_HOST}/files/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${currentToken}`,
            },
          }
        );

        imageFileName = uploadResponse.data[0];
        console.log("📸 이미지 업로드 완료:", imageFileName);
      }

      // 기부 데이터 생성
      const donationData = {
        amount: parseInt(price, 10),
        count: 1,
        brand: brand,
        pname: pname,
        imageFile: imageFileName, // 업로드된 이미지 파일명 추가
      };

      console.log("💝 기부 데이터:", donationData);

      const response = await axios.post(
        `${API_SERVER_HOST}/api/donations`,
        donationData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      setMessage(
        "기부가 완료되었습니다! 당신의 기부에 감사합니다! 기부 내역은 마이페이지에서 확인할 수 있습니다."
      );
      setBrand("");
      setPname("");
      setPrice("");
      setImageFile(null);
      setImagePreview(null);
      
      return;
    } catch (e) {
      console.error("❌ 기부 실패:", e);
      setError(
        e.response?.data?.message ||
          e.message ||
          "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          기부하기
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              브랜드
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="브랜드명 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상품 이름
            </label>
            <input
              type="text"
              value={pname}
              onChange={(e) => setPname(e.target.value)}
              placeholder="상품명 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              가격 (원)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="가격 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기부 이미지 (선택)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImageFile(e.target.files[0]);
                } else {
                  setImageFile(null);
                }
              }}
              className="w-full"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="기부 이미지 미리보기"
                  className="w-24 h-24 object-cover rounded border"
                />
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        {message && <p className="text-green-500 text-sm mt-3">{message}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            닫기
          </button>
          <button
            onClick={handleDonate}
            disabled={loading}
            className="px-6 py-2 text-white bg-gradient-to-r from-pink-500 to-red-500 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                기부중...
              </span>
            ) : (
              "기부하기"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DonationModalComponent;
