// src/components/selling/ReadComponent.js

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOne, deleteOne } from "../../api/productsApi";
import { API_SERVER_HOST } from "../../api/backendApi";
import useCustomMove from "../../hooks/useCustomMove";
import FetchingModal from "../common/FetchingModal";
import useCustomLogin from "../../hooks/useCustomLogin";
import useCustomCart from "../../hooks/useCustomCart";
import ResultModal from "../../components/common/ResultModal";
import "./ReadComponent.css";

const initState = {
  pno: 0,
  pname: "",
  brand: "",
  pdesc: "",
  price: 0,
  discountRate: 0,
  salePrice: 0,
  uploadFileNames: [],
};

const ReadComponent = () => {
  const { pno } = useParams();
  const numPno = parseInt(pno, 10);
  const host = API_SERVER_HOST;

  const [product, setProduct] = useState(initState);
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [modal, setModal] = useState({ open: false, msg: "" });
  const [confirm, setConfirm] = useState({
    open: false,
    msg: "",
    onConfirm: null,
  });

  const { moveToList, moveToModify } = useCustomMove();
  const { changeCart, cartItems } = useCustomCart();
  const { loginState } = useCustomLogin();

  const handleClickAddCart = () => {
    let qty = 1;
    const addedItem = cartItems.find((item) => item.pno === numPno);
    if (addedItem) {
      setConfirm({
        open: true,
        msg: "이미 추가된 상품입니다. 추가하시겠습니까?",
        onConfirm: () => {
          qty = addedItem.qty + 1;
          changeCart({ email: loginState.email, pno: numPno, qty });
          setModal({ open: true, msg: "장바구니에 추가되었습니다." });
          // 목록 페이지로 이동
          setTimeout(() => {
            moveToList("/selling");
          }, 1500);
        },
      });
      return;
    }

    setConfirm({
      open: true,
      msg: "장바구니에 담으시겠습니까?",
      onConfirm: () => {
        changeCart({ email: loginState.email, pno: numPno, qty });
        setModal({ open: true, msg: "장바구니에 추가되었습니다." });
        // 목록 페이지로 이동
        setTimeout(() => {
          moveToList("/selling");
        }, 500);
      },
    });
  };

  const handleClickDelete = async () => {
    setConfirm({
      open: true,
      msg: "정말 이 상품을 삭제하시겠습니까?",
      onConfirm: async () => {
        setFetching(true);
        try {
          await deleteOne(numPno);
          setModal({ open: true, msg: "상품이 삭제되었습니다." });
          // 성공 메시지를 2초간 표시한 후 목록 페이지로 이동
          setTimeout(() => {
            moveToList("/selling");
          }, 2000);
        } catch (err) {
          console.error("삭제 오류:", err);
          console.error("삭제 오류 상세:", err.response?.data);
          console.error("삭제 오류 상태:", err.response?.status);
          
          let errorMessage = "상품 삭제에 실패했습니다.";
          if (err.response?.status === 401) {
            errorMessage = "로그인이 필요합니다.";
          } else if (err.response?.status === 403) {
            errorMessage = "삭제 권한이 없습니다.";
          } else if (err.response?.data?.error) {
            errorMessage = err.response.data.error;
          }
          
          setModal({ open: true, msg: errorMessage });
        } finally {
          setFetching(false);
        }
      },
    });
  };

  useEffect(() => {
    if (!numPno || isNaN(numPno)) {
      setError("유효하지 않은 상품 번호입니다.");
      return;
    }
    setFetching(true);
    setError(null);
    getOne(numPno)
      .then((data) => {
        setProduct(data);
        setFetching(false);
      })
      .catch((err) => {
        console.error("상품 조회 오류:", err);
        setError("상품 정보를 불러오는데 실패했습니다.");
        setFetching(false);
        setModal({ open: true, msg: "상품 정보를 불러오는데 실패했습니다." });
      });
  }, [numPno]);

  if (error) {
    return (
      <div className="read-component">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button
            onClick={() => moveToList("/selling")}
            className="error-button"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  const hasDiscount = product.salePrice != null && product.discountRate > 0;

  return (
    <div className="read-component">
      {fetching && <FetchingModal />}
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

      <div className="read-container">
        <div className="read-content">
          {/* 좌측: 이미지 */}
          <div className="image-section">
            {product.uploadFileNames.length > 0 ? (
              product.uploadFileNames.map((imgFile, i) => (
                <div className="image-box" key={i}>
                  <img
                    className="product-image"
                    src={`${host}/api/products/view/${imgFile}`}
                    alt="product"
                  />
                </div>
              ))
            ) : (
              <div className="no-image">이미지 없음</div>
            )}
          </div>

          {/* 우측: 상세 정보 */}
          <div className="info-section">
            {/* 수정/삭제 버튼을 info-section 오른쪽 상단에 배치 */}
            <div className="edit-delete-group">
              {/* <button
                onClick={() => moveToModify(numPno, "/selling")}
                className="action-button modify-button"
              >
                수정
              </button> */}
              <button
                onClick={handleClickDelete}
                className="action-button delete-button"
              >
                삭제
              </button>
            </div>
            <div className="info-item">
              <dt className="info-label">브랜드</dt>
              <dd className="info-value">{product.brand}</dd>
            </div>
            <div className="info-item">
              <dt className="info-label">상품명</dt>
              <dd className="info-value">{product.pname}</dd>
            </div>
            <div className="info-item">
              <dt className="info-label">가격</dt>
              <dd className="info-value">
                <div className="price-info">
                  {hasDiscount ? (
                    <>
                      <span className="discount-badge">
                        ~{product.discountRate}%
                      </span>
                      <span className="sale-price">
                        {product.salePrice.toLocaleString()}원
                      </span>
                      <span className="original-price">
                        {product.price.toLocaleString()}원
                      </span>
                    </>
                  ) : (
                    <span className="sale-price">
                      {product.price?.toLocaleString() ?? "가격 정보 없음"}원
                    </span>
                  )}
                </div>
              </dd>
            </div>
            {/* 장바구니/목록 버튼은 info-section 하단에 유지 */}
            <div className="button-group">
              <button
                onClick={handleClickAddCart}
                className="action-button cart-button"
              >
                장바구니
              </button>
              <button
                onClick={() => moveToList("/selling")}
                className="action-button list-button"
              >
                목록
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadComponent;
