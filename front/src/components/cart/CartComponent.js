// src/components/CartComponent.js
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCustomLogin from "../../hooks/useCustomLogin";
import useCustomCart from "../../hooks/useCustomCart";
import { createOrder } from "../../api/orderApi"; // ← 추가
import CartItemComponent from "./CartItemComponent";
import ResultModal from "../../components/common/ResultModal";

const CartComponent = () => {
  const { isLogin, loginState } = useCustomLogin();
  const { refreshCart, cartItems, changeCart, deleteCartItem } =
    useCustomCart();
  const navigate = useNavigate();

  const [checkedItems, setCheckedItems] = useState([]); // 선택된 cino 배열
  const [modal, setModal] = useState({ open: false, msg: "" });

  const total = useMemo(
    () =>
      cartItems
        .filter((item) => checkedItems.includes(item.cino))
        .filter(item => item.pname !== '기부' && item.brand !== '기부') // 기부 상품 필터링
        .reduce((sum, item) => {
          // 할인가가 있으면 할인가를, 없으면 원가를 사용
          const price = item.salePrice || item.price;
          return sum + price * item.qty;
        }, 0),
    [cartItems, checkedItems]
  );

  const filteredCartItems = cartItems.filter(item => item.pname !== '기부' && item.brand !== '기부');
  const isAllChecked =
    filteredCartItems.length > 0 && checkedItems.length === filteredCartItems.length;

  useEffect(() => {
    if (isLogin) {
      refreshCart();
    }
  }, [isLogin]);

  const handleToggleAll = () => {
    if (isAllChecked) {
      setCheckedItems([]);
    } else {
      setCheckedItems(filteredCartItems.map((item) => item.cino));
    }
  };

  const handleToggleItem = (cino) => {
    setCheckedItems((prev) =>
      prev.includes(cino) ? prev.filter((id) => id !== cino) : [...prev, cino]
    );
  };

  const handlePurchase = async () => {
    const selectedItems = cartItems.filter((item) =>
      checkedItems.includes(item.cino)
    );
    if (selectedItems.length === 0) {
      setModal({ open: true, msg: "상품을 하나 이상 선택해주세요." });
      return;
    }
    // 결제창 띄우지 않고 구매 페이지로 이동만
    navigate("/order/purchase", {
      state: {
        selectedItems,
      },
    });
  };

  const handleDeleteSelected = async () => {
    if (checkedItems.length === 0) {
      setModal({ open: true, msg: "삭제할 상품을 선택해주세요." });
      return;
    }

    const selectedItems = cartItems.filter((item) =>
      checkedItems.includes(item.cino)
    );

    try {
      // 선택된 모든 상품을 순차적으로 삭제
      for (const item of selectedItems) {
        await deleteCartItem(item.cino);
      }

      // 선택 상태 초기화
      setCheckedItems([]);

      setModal({
        open: true,
        msg: `${selectedItems.length}개의 상품이 장바구니에서 삭제되었습니다.`,
      });
    } catch (error) {
      console.error("상품 삭제 실패:", error);
      setModal({
        open: true,
        msg: "상품 삭제 중 오류가 발생했습니다.",
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto mt-10 px-4">
      {isLogin ? (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 왼쪽 - 장바구니 상품 목록 */}
          <div className="flex-1">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-2xl font-bold">
                <span className="text-gray-800">장바구니</span>
              </h2>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAllChecked}
                  onChange={handleToggleAll}
                />
                <span className="text-gray-700 font-medium">전체 선택</span>
                <span className="text-sm text-gray-500">
                  ({checkedItems.length}/{filteredCartItems.length})
                </span>
              </div>

              {checkedItems.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
                >
                  선택 삭제 ({checkedItems.length})
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4 mt-4">
              {cartItems
                .filter(item => item.pname !== '기부' && item.brand !== '기부') // 기부 상품 필터링
                .map((item) => (
                <CartItemComponent
                  key={item.cino}
                  {...item}
                  changeCart={changeCart}
                  memberid={loginState.email}
                  checked={checkedItems.includes(item.cino)}
                  onToggle={() => handleToggleItem(item.cino)}
                />
              ))}
            </div>
          </div>

          {/* 오른쪽 - 결제 요약 정보 */}
          <div className="w-full lg:w-1/3 bg-gray-50 border rounded-md p-6 shadow-sm h-fit">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              주문 예상 금액
            </h3>

            <div className="text-sm flex justify-between py-2 border-b">
              <span>총 상품 가격</span>
              <span>{total.toLocaleString()}원</span>
            </div>
            <div className="text-sm flex justify-between py-2 border-b">
              <span>총 할인</span>
              <span className="text-red-500">-0원</span>
            </div>
            <div className="text-lg font-bold flex justify-between pt-4">
              <span>총 결제금액</span>
              <span className="text-blue-600 text-xl">
                {total.toLocaleString()}원
              </span>
            </div>

            <button
              onClick={handlePurchase}
              className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded font-semibold text-lg"
            >
              구매하기 ({checkedItems.length})
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 text-lg mt-20">
          로그인 후 장바구니를 확인하세요.
        </div>
      )}
      {modal.open && (
        <ResultModal
          title="알림"
          content={modal.msg}
          callbackFn={() => setModal({ open: false, msg: "" })}
        />
      )}
    </div>
  );
};

export default CartComponent;
