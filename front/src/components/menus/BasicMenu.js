import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import useLogin from "../../hooks/useCustomLogin";
import { useSearch } from "../../context/SearchContext";
import { getCartCount } from "../../api/cartApi";

const BasicMenu = () => {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const { isLogin, doLogout } = useLogin();
  //검색창 개별 동작 가능하도록 개선
  const [headerTerm, setHeaderTerm] = useState("");
  //이미지 개별 동작 가능토록 개선
  const [imageHeaderFile, setImageHeaderFile] = useState(null);
  const [imageHeaderPreview, setImageHeaderPreview] = useState("");
  const fileInputRef = useRef(null);
  const triggerFileSelect = useCallback(() => fileInputRef.current.click(), []);
  // const { analyzeImageAndSearch } = useSearch();
  const location = useLocation();
  const {
    performTextSearch,
    analyzeImageAndSearch,

    isLoading,
  } = useSearch();

  // 장바구니 개수 상태
  const [cartCount, setCartCount] = useState(0);

  // 장바구니 개수 조회
  const fetchCartCount = async () => {
    if (isLogin) {
      try {
        console.log("현재 로그인 상태:", isLogin);
        const count = await getCartCount();
        setCartCount(count);
      } catch (error) {
        console.error("장바구니 개수 조회 실패:", error);
        console.error("에러 상세:", error.response?.data);
        setCartCount(0);
      }
    } else {
      setCartCount(0);
    }
  };

  // 로그인 상태가 변경될 때마다 장바구니 개수 조회
  useEffect(() => {
    fetchCartCount();
  }, [isLogin]);

  // 페이지 새로고침 시 장바구니 개수 업데이트
  useEffect(() => {
    const handleStorageChange = () => {
      fetchCartCount();
    };

    // 커스텀 이벤트 리스너 추가
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    // 장바구니 추가 성공 이벤트 리스너 추가
    const handleCartAddSuccess = () => {
      fetchCartCount();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("cartAddSuccess", handleCartAddSuccess);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("cartAddSuccess", handleCartAddSuccess);
    };
  }, []);

  //통합 검색 핸들 -> 이미지 파일 유무에 따라 다른 함수 호출
  const handleSearch = () => {
    if (imageHeaderFile) {
      analyzeImageAndSearch(imageHeaderFile);
      clearImage();
    } else {
      performTextSearch(headerTerm);
    }
    setHeaderTerm("");
  };

  useEffect(() => {
    setHeaderTerm("");
    clearImage(); // 이미지도 함께 비워줍니다.
  }, [location.pathname]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setImageHeaderFile(file);
      setImageHeaderPreview(URL.createObjectURL(file));
    }
    e.target.value = null;
  }, []);

  const clearImage = () => {
    setImageHeaderFile(null);
    setImageHeaderPreview("");
  };

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setImageHeaderFile(file);
            setImageHeaderPreview(URL.createObjectURL(file));
            setHeaderTerm("");
            break;
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <header className="bg-white border-b mt-4">
      {/* Top bar */}
      <div className="container mx-auto flex items-center justify-between py-2 px-4 border-b border-gray-200">
        {/* 로고 */}
        <div className="w-32 flex-shrink-0">
          <Link to="/">
            <img src="/logo5.jpg" alt="Gifree 로고" className="h-12 w-auto" />
          </Link>
        </div>

        {/* 검색창 (PC) */}
        <div className="hidden lg:flex flex-1 justify-center px-4">
          {/* ✨ 전체 컨테이너 */}
          <div className="flex w-full max-w-[600px] items-center">
            {/* ✨ 1. 텍스트 입력창 (맨 왼쪽) */}
            <div className="relative flex-1 h-12 group">
              <input
                type="text"
                placeholder={
                  imageHeaderPreview
                    ? ""
                    : "상품명, 브랜드명 또는 브랜드 이미지로 검색해보세요"
                }
                value={headerTerm}
                onChange={(e) => setHeaderTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                disabled={!!imageHeaderPreview}
                className="w-full h-12 bg-gray-100 border-y border-l border-gray-300 rounded-l-full px-4 py-2 focus:outline-none"
              />

              {/* 이미지 미리보기는 입력창 안에 표시됩니다. */}
              {imageHeaderPreview && (
                <div className="absolute top-1/2 -translate-y-1/2 left-3 flex items-center bg-blue-100 rounded-full pl-0.5 pr-0.5 py-0 text-xs text-blue-800">
                  <div className="flex items-center">
                    <img
                      src={imageHeaderPreview}
                      alt="미리보기"
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    {/* 호버 시 큰 이미지 미리보기 */}
                    <img
                      src={imageHeaderPreview}
                      alt="미리보기 크게"
                      className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute top-0 left-full ml-2 w-32 h-32 object-contain bg-white rounded-lg border-2 z-[9999] shadow-xl"
                    />
                    <span className="ml-0.5 text-xs">이미지</span>
                  </div>
                  <button
                    onClick={clearImage}
                    className="ml-0.5 font-bold hover:text-red-500 text-xs"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={triggerFileSelect}
              className="p-4 h-12 text-xl text-gray-600 bg-gray-100 border-y border-gray-300 
         hover:bg-gray-200 flex items-center justify-center rounded-none appearance-none"
            >
              {/* Heroicons 에서 가져온 아이콘(카메라임) */}
              <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth="1.5"
  stroke="currentColor"
  strokeLinecap="square"
  strokeLinejoin="miter"
  className="size-6"
>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                />
              </svg>
            </button>

            <button
              onClick={handleSearch}
              className="p-4 h-12 bg-blue-500 flex items-center justify-center text-white rounded-r-full disabled:bg-gray-400 "
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>

            {/* 숨겨진 파일 입력 */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              style={{ display: "none" }}
              accept="image/*"
            />
          </div>
        </div>

        {/* 로그인 / 장바구니 */}
        <div className="flex space-x-2 text-sm lg:text-base flex-shrink-0">
          {isLogin ? (
            <Link
              to="/member/mypage"
              className="border-2 border-blue-500 text-blue-500 px-3 py-1 rounded-full hover:bg-blue-50"
            >
              마이페이지
            </Link>
          ) : (
            <Link
              to="/member/login"
              className="border-2 border-blue-500 text-blue-500 px-3 py-1 rounded-full hover:bg-blue-50"
            >
              로그인
            </Link>
          )}
          <Link
            to="/cart"
            className="border-2 border-blue-500 text-blue-500 px-3 py-1 rounded-full hover:bg-blue-50 flex items-center gap-1"
          >
            장바구니
            <span
              className={`text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] ${
                cartCount > 0
                  ? "bg-red-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          </Link>
        </div>
      </div>

      {/* 반응형 */}

      <div className="flex w-full items-center px-4 lg:hidden">
        <div className="flex w-full max-w-full items-center">
          {/* 텍스트 입력창과 이미지 미리보기 컨테이너 */}
          <div className="relative flex-1 h-full group">
            <input
              type="text"
              placeholder={imageHeaderPreview ? "" : "상품을 검색해보세요"}
              value={headerTerm}
              onChange={(e) => setHeaderTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              disabled={!!imageHeaderPreview}
              className="w-full h-10 bg-gray-100 border-y border-l border-gray-300 rounded-l-full pl-4 pr-2 focus:outline-none"
            />

            {/* ✨ 모바일에서도 이미지 미리보기 표시 */}
            {imageHeaderPreview && (
              <div className="absolute top-1/2 -translate-y-1/2 left-3 flex items-center bg-blue-100 rounded-full pl-0.5 pr-0.5 py-0 text-xs text-blue-800">
                <img
                  src={imageHeaderPreview}
                  alt="미리보기"
                  className="h-5 w-5 rounded-full object-cover"
                />
                <span className="ml-0.5 text-xs">이미지</span>
                <button
                  onClick={clearImage}
                  className="ml-0.5 font-bold hover:text-red-500 text-xs"
                >
                  &times;
                </button>
              </div>
            )}
          </div>

          {/* ✨ 카메라 버튼 추가 */}
          <button
            onClick={triggerFileSelect}
            className="p-3 h-10 text-gray-600 bg-gray-100 border-y border-gray-300 hover:bg-gray-200 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
              />
            </svg>
          </button>

          {/* 돋보기 버튼 */}
          <button
            onClick={
              handleSearch
            } /* handleSearch 함수는 이미지/텍스트 검색을 모두 처리합니다 */
            className="p-3 h-10 bg-blue-500 flex items-center justify-center text-white rounded-r-full"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          style={{ display: "none" }}
          accept="image/*"
        />
      </div>

      {/* Nav 바 */}
      <nav className="bg-white border-t">
        <div className="max-w-screen-xl mx-auto px-4 py-2">
          <ul className="flex items-center justify-between w-full">
            {/* 카테고리 */}
            <li className="relative">
              <button
                onClick={() => setCategoryOpen((prev) => !prev)}
                className="flex items-center bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span className="hidden lg:inline-block ml-2">카테고리</span>
              </button>
              {categoryOpen && (
                <ul className="absolute top-full left-0 bg-white border rounded shadow mt-2 z-10 w-40">
                  <li>
                    <Link
                      to="/category/drink"
                      className="block px-4 py-2 hover:bg-blue-100"
                    >
                      음료
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/category/food"
                      className="block px-4 py-2 hover:bg-blue-100"
                    >
                      음식
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/category/convenience"
                      className="block px-4 py-2 hover:bg-blue-100"
                    >
                      편의점
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/category/dessert"
                      className="block px-4 py-2 hover:bg-blue-100"
                    >
                      디저트
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* 기타 메뉴 */}

            <li>
              <Link
                to="/selling"
                className="text-gray-700 font-medium hover:text-blue-500"
              >
                구매
              </Link>
            </li>
            <li>
              <Link
                to="/board"
                className="text-gray-700 font-medium hover:text-blue-500"
              >
                게시판
              </Link>
            </li>
            <li>
              <Link
                to="/map"
                className="text-gray-700 font-medium hover:text-blue-500"
              >
                우리 동네 기프티콘
              </Link>
            </li>
            <li>
              <Link
                to="/randombox"
                className="text-gray-700 font-medium hover:text-blue-500"
              >
                랜덤박스
              </Link>
            </li>
            <li>
              <Link
                to="/donationBoard"
                className="text-gray-700 font-medium hover:text-blue-500"
              >
                기부
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default BasicMenu;
