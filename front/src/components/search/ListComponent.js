import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";
import "./ListComponent.css";
import useCustomLogin from "../../hooks/useCustomLogin";
import useCustomCart from "../../hooks/useCustomCart";
import ResultModal from "../common/ResultModal";

const ListComponent = () => {
  const {
    searchResults,
    isLoading,
    displayTerm,
    performTextSearch,
    initialProducts,
    isInitialLoading,
  } = useSearch();

  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const { loginState } = useCustomLogin();
  const { changeCart, cartItems } = useCustomCart();

  const [modal, setModal] = useState({ open: false, msg: "" });
  const [confirm, setConfirm] = useState({
    open: false,
    msg: "",
    onConfirm: null,
  });

  //페이지 내 검색창 실행 함수
  const handleSearch = () => {
    performTextSearch(searchTerm);

    setSearchTerm("");
  };

  useEffect(() => {
    setSearchTerm("");
  }, [location.pathname]);

  const hasSearched = displayTerm && displayTerm.length > 0;
  const itemsToDisplay =
    hasSearched && searchResults.length > 0
      ? searchResults // 검색 결과가 있다면 검색 결과를 보여줌
      : initialProducts; // 그 외의 경우 전체 상품 목록

  const searchResult =
    hasSearched && searchResults.length > 0
      ? `'${displayTerm}' 검색 결과`
      : "상품 리스트";

  const handleClickAddCart = (product, e) => {
    e.stopPropagation(); // 상품 카드 클릭 이벤트 방지

    if (!loginState.email) {
      setModal({ open: true, msg: "로그인이 필요합니다." });
      return;
    }

    let qty = 1;
    const addedItem = cartItems.find((item) => item.pno === product.pno);

    if (addedItem) {
      setConfirm({
        open: true,
        msg: "이미 추가된 상품입니다. 추가하시겠습니까?",
        onConfirm: () => {
          qty = addedItem.qty + 1;
          changeCart({ email: loginState.email, pno: product.pno, qty });
          setModal({ open: true, msg: "장바구니에 추가되었습니다." });
        },
      });
      return;
    }

    setConfirm({
      open: true,
      msg: "장바구니에 담겠습니까?",
      onConfirm: () => {
        changeCart({ email: loginState.email, pno: product.pno, qty });
        setModal({ open: true, msg: "장바구니에 추가되었습니다." });
      },
    });
  };

  if (isLoading || (hasSearched === false && isInitialLoading)) {
    return <div>상품을 불러오는 중...</div>;
  }

  return (
    <>
      {modal.open && (
        <ResultModal
          title="알림"
          content={modal.msg}
          callbackFn={() => setModal({ open: false, msg: "" })}
        />
      )}
      {confirm.open && (
        <div className="confirm-modal">
          <div className="confirm-content">
            <div className="confirm-message">{confirm.msg}</div>
            <div className="confirm-buttons">
              <button
                className="confirm-button confirm-yes"
                onClick={() => {
                  confirm.onConfirm && confirm.onConfirm();
                  setConfirm({ ...confirm, open: false });
                }}
              >
                확인
              </button>
              <button
                className="confirm-button confirm-no"
                onClick={() => setConfirm({ ...confirm, open: false })}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <h1>상품 검색</h1>

      {/* 검색창 */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder={"원하는 상품 또는 브랜드를 검색하세요"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="search-input"
          />
        </div>

        <button onClick={handleSearch} className="search-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="search-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </button>
      </div>

      {/* 검색결과 없을 시 */}
      {hasSearched && searchResults.length === 0 && (
        <div className="no-items">
          <p className="no-items-text-bold">
            '{displayTerm}'에 대한 검색 결과가 없습니다.
          </p>
          <p className="no-items-text-sub">
            기프리에서 판매중인 다른 상품을 만나보세요.
          </p>
        </div>
      )}
      <div className="selling-page">
        <h2>{searchResult}</h2>

        {/* 제품 리스트 */}
        <ul className="product-list">
          {itemsToDisplay.map((item) => {
            // 디버깅을 위해 상품 데이터 출력
            console.log("상품 데이터:", item);
            console.log("이미지 URL:", item.imageUrl);
            console.log("업로드 파일명:", item.uploadFileNames);

            const hasDiscount =
              item.salePrice != null &&
              item.discountRate != null &&
              item.discountRate > 0;
            return (
              <li key={item.pno} className="product-card">
                <Link to={`/selling/read/${item.pno}`} className="product-link">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.pname}
                      className="product-image"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                    />
                  ) : null}
                  {!item.imageUrl && (
                    <div className="product-image-placeholder">
                      <span>이미지 없음</span>
                    </div>
                  )}
                  <p className="brand">
                    {item.brand ??
                      (item.pname ? item.pname.split(" ")[0] : "알 수 없음")}
                  </p>
                  <p className="title">{item.pname}</p>
                  {hasDiscount ? (
                    <p className="price">
                      <span className="discount">~{item.discountRate}%</span>
                      <span className="sale-price">
                        {item.salePrice.toLocaleString()}원
                      </span>
                      <span className="original-price">
                        {item.price.toLocaleString()}원
                      </span>
                    </p>
                  ) : (
                    <p className="price">
                      {item.price?.toLocaleString() ?? "가격 정보 없음"}원
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};
export default ListComponent;
