// src/components/order/PurchaseComponent.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useCustomLogin from "../../hooks/useCustomLogin";
import { createOrder, addToCollection } from "../../api/orderApi"; // addToCollection 추가
import ResultModal from "../common/ResultModal"; // 모달 컴포넌트 추가
import { useDispatch } from "react-redux"; // Redux dispatch 추가
import { postChangeCartAsync } from "../../slices/cartSlice"; // 장바구니 삭제 액션 추가
import { getCookie } from "../../util/cookieUtil"; // 쿠키 유틸리티 추가

const APPLICATION_ID = "6880972a836e97280fee7b0b"; // JavaScript 키

export default function PurchaseComponent() {
  const { isLogin, loginState } = useCustomLogin();
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Redux dispatch 추가
  const selected = state?.selectedItems || [];

  const filteredSelected = selected.filter(
    (item) => item.pname !== "기부" && item.brand !== "기부"
  );

  const subtotal = useMemo(
    () =>
      filteredSelected.reduce((sum, it) => {
        // 할인가가 있으면 할인가를, 없으면 원가를 사용
        const price = it.salePrice || it.price;
        return sum + price * it.qty;
      }, 0),
    [filteredSelected]
  );

  const [sdkReady, setSdkReady] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", content: "" });

  // BootPay SDK 로드 - CORS 오류 방지를 위해 다른 방식 사용
  useEffect(() => {
    // 이미 로드되어 있는지 확인
    if (window.BootPay || window.bootpay || window.Bootpay) {
      setSdkReady(true);
      return;
    }

    // 동적으로 스크립트 로드
    const loadBootpayScript = async () => {
      try {
        // 방법 1: 동적 import 시도
        if (typeof window !== "undefined") {
          const script = document.createElement("script");
          script.src = "https://cdn.bootpay.co.kr/js/bootpay-3.2.3.min.js";
          script.async = true;

          script.onload = () => {
            console.log("BootPay SDK 로드 성공");
            setSdkReady(true);
          };

          script.onerror = () => {
            console.error("BootPay SDK 로드 실패 - 대체 방법 시도");
            // 대체 방법: 직접 결제창 띄우기
            setSdkReady(true);
          };

          document.head.appendChild(script);
        }
      } catch (error) {
        console.error("BootPay SDK 로드 오류:", error);
        setSdkReady(true); // 오류가 있어도 진행
      }
    };

    loadBootpayScript();
  }, []);

  // 보관함에 상품 추가하는 함수
  const addItemsToCollection = async (items) => {
    try {
      for (const item of items) {
        const collectionData = {
          pno: item.pno,
          pname: item.pname,
          price: item.price,
          pdesc: item.pdesc,
          brand: item.brand,
          uploadFileNames: item.imageFile ? [item.imageFile] : [], // 항상 배열로
          source: "purchase",
        };
        await addToCollection(collectionData);
      }
    } catch (error) {
      // 보관함 추가 실패해도 구매는 계속 진행
    }
  };

  // 장바구니에서 구매한 상품 삭제하는 함수
  const removeItemsFromCart = async (items) => {
    try {
      // 토큰 상태 확인
      const memberInfo = getCookie("member");
      if (!memberInfo || !memberInfo.accessToken) {
        console.log("토큰이 없어서 장바구니 삭제를 건너뜁니다.");
        return;
      }

      for (const item of items) {
        try {
          // 장바구니에서 상품 삭제 (수량을 0으로 설정)
          await dispatch(
            postChangeCartAsync({
              email: loginState.email,
              pno: item.pno,
              qty: 0, // 수량을 0으로 설정하여 삭제
            })
          );
          console.log(`상품 ${item.pname}을 장바구니에서 삭제했습니다.`);
          // 장바구니 개수 업데이트 이벤트 발생
          window.dispatchEvent(new Event("cartUpdated"));
        } catch (itemError) {
          console.error(`상품 ${item.pname} 장바구니 삭제 실패:`, itemError);
          // 개별 상품 삭제 실패해도 계속 진행
          continue;
        }
      }
    } catch (error) {
      console.error("장바구니 삭제 실패:", error);
      // 장바구니 삭제 실패해도 구매는 계속 진행
      // 로그아웃되지 않도록 에러를 무시
    }
  };

  const handlePayment = useCallback(async () => {
    if (!sdkReady) {
      setModal({
        open: true,
        title: "결제 준비 중",
        content: "결제 SDK 준비 중입니다. 잠시만 기다려주세요.",
      });
      return;
    }

    // 부트페이 객체 확인
    const bootpay = window.BootPay || window.bootpay || window.Bootpay;
    if (!bootpay) {
      setModal({
        open: true,
        title: "결제 오류",
        content: "결제 SDK를 찾을 수 없습니다.",
      });
      return;
    }

    try {
      // 간단한 결제창만 띄우기
      const paymentRequest = bootpay.request({
        application_id: APPLICATION_ID,
        price: subtotal,
        name: `주문상품 ${selected.length}건`,
        // pg: "nicepay",
        method: "card",
        order_id: `order_${Date.now()}`,
        user_info: {
          username: loginState.email,
          email: loginState.email,
        },
        // 테스트용 결제 정보 추가
        extra: {
          card_quota: "0,2,3", // 할부 개월 수 (일시불, 2개월, 3개월)
          seller_name: "GIFREE", // 판매자명
          delivery_day: "1", // 배송일
          delivery_name: loginState.email, // 수령인명
          delivery_tel: "010-1234-5678", // 수령인 연락처
          delivery_addr: "서울시 강남구", // 배송주소
          delivery_postcode: "12345", // 우편번호
          // 테스트 모드용 설정
          test_verification: true, // 테스트 검증 활성화
        },
      });

      // Promise 방식으로 처리
      if (paymentRequest && typeof paymentRequest.then === "function") {
        paymentRequest
          .then(async (response) => {
            console.log("결제 완료 (Promise):", response);

            // 부트페이 결제창 강제로 닫기
            if (bootpay && typeof bootpay.close === "function") {
              try {
                bootpay.close();
              } catch (e) {
                console.log("부트페이 close 오류:", e);
              }
            }

            // 부트페이 관련 DOM 요소들 제거 (안전한 방법)
            try {
              const bootpayElements = document.querySelectorAll(
                '[id*="bootpay"], [class*="bootpay"]'
              );
              bootpayElements.forEach((el) => {
                if (el && el.parentNode) {
                  el.parentNode.removeChild(el);
                }
              });

              // 모달 오버레이 제거
              const overlays = document.querySelectorAll(
                ".modal-overlay, .bootpay-overlay"
              );
              overlays.forEach((overlay) => {
                if (overlay && overlay.parentNode) {
                  overlay.parentNode.removeChild(overlay);
                }
              });
            } catch (e) {
              console.log("DOM 정리 오류:", e);
            }

            setModal({
              open: true,
              title: "🎉 결제 완료!",
              content:
                "결제가 성공적으로 완료되었습니다!\n\n상품이 구매내역과 보관함에 추가되었습니다.",
            });

            // URL 파라미터로 결제 정보 전달
            const orderId = `order_${Date.now()}`;
            const params = new URLSearchParams({
              receiptId: response.receipt_id,
              orderId: orderId,
              totalAmount: subtotal.toString(),
              itemCount: selected.length.toString(),
            });

            // 결제 성공 콜백 내부
            const orderReq = {
              memberId: loginState.email,
              couponCode: null,
              receiptId: response.receipt_id, // 결제 영수증 ID
              items: filteredSelected.map((it) => ({
                pno: it.pno,
                qty: it.qty,
              })),
            };

            try {
              const {
                data: { ono },
              } = await createOrder(orderReq);

              // 실제 결제된 상품 정보를 보관함에 추가
              await addItemsToCollection(
                filteredSelected.map((item) => ({
                  ...item,
                  uploadFileNames: item.imageFile ? [item.imageFile] : [],
                }))
              );

              // 구매 완료 후 장바구니에서 상품 삭제 (선택적)
              try {
                await removeItemsFromCart(filteredSelected);
              } catch (cartError) {
                console.log(
                  "장바구니 삭제 실패, 하지만 구매는 완료됨:",
                  cartError
                );
                // 장바구니 삭제 실패해도 구매는 완료된 것으로 처리
              }

              // 모달 닫힌 후 주문 완료 페이지로 이동
              setTimeout(() => {
                navigate("/order/complete", {
                  state: {
                    selectedItems: filteredSelected,
                    ono,
                    receiptId: response.receipt_id,
                  },
                });
              }, 2000);
            } catch (error) {
              console.error("결제 후 주문 저장 실패:", error);
              setModal({
                open: true,
                title: "주문 저장 실패",
                content:
                  "결제 후 주문 저장에 실패했습니다.\n고객센터에 문의해주세요.",
              });
            }
          })
          .catch((error) => {
            console.error("결제 실패 (Promise):", error);
            setModal({
              open: true,
              title: "결제 실패",
              content: "결제에 실패했습니다.\n다시 시도해주세요.",
            });
          });
      } else {
        // 체이닝 방식으로 처리
        paymentRequest
          .error((error) => {
            console.error("결제 에러:", error);
            setModal({
              open: true,
              title: "결제 오류",
              content: "결제 중 오류가 발생했습니다.\n다시 시도해주세요.",
            });
          })
          .cancel(() => {
            console.log("결제 취소됨");
            setModal({
              open: true,
              title: "결제 취소",
              content: "결제가 취소되었습니다.",
            });
          })
          .confirm((data) => {
            console.log("결제 확인됨:", data);
            // 결제 승인 후 바로 완료 처리
            setTimeout(async () => {
              console.log("결제 완료 처리:", data);

              // 부트페이 결제창 강제로 닫기
              if (bootpay && typeof bootpay.close === "function") {
                try {
                  bootpay.close();
                } catch (e) {
                  console.log("부트페이 close 오류:", e);
                }
              }

              // 부트페이 관련 DOM 요소들 제거 (안전한 방법)
              try {
                const bootpayElements = document.querySelectorAll(
                  '[id*="bootpay"], [class*="bootpay"]'
                );
                bootpayElements.forEach((el) => {
                  if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                  }
                });

                // 모달 오버레이 제거
                const overlays = document.querySelectorAll(
                  ".modal-overlay, .bootpay-overlay"
                );
                overlays.forEach((overlay) => {
                  if (overlay && overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                  }
                });
              } catch (e) {
                console.log("DOM 정리 오류:", e);
              }

              setModal({
                open: true,
                title: "🎉 결제 완료!",
                content:
                  "결제가 성공적으로 완료되었습니다!\n\n상품이 구매내역과 보관함에 추가되었습니다.",
              });

              // URL 파라미터로 결제 정보 전달
              const orderId = `order_${Date.now()}`;
              const params = new URLSearchParams({
                receiptId: data.receipt_id,
                orderId: orderId,
                totalAmount: subtotal.toString(),
                itemCount: selected.length.toString(),
              });

              // 결제 성공 콜백 내부
              const orderReq = {
                memberId: loginState.email,
                couponCode: null,
                receiptId: data.receipt_id, // 결제 영수증 ID
                items: filteredSelected.map((it) => ({
                  pno: it.pno,
                  qty: it.qty,
                })),
              };

              try {
                const {
                  data: { ono },
                } = await createOrder(orderReq);

                // 구매 완료 후 보관함에 상품 추가
                await addItemsToCollection(filteredSelected); // filteredSelected는 실제 결제된 상품 리스트

                // 구매 완료 후 장바구니에서 상품 삭제 (선택적)
                try {
                  await removeItemsFromCart(filteredSelected);
                } catch (cartError) {
                  console.log(
                    "장바구니 삭제 실패, 하지만 구매는 완료됨:",
                    cartError
                  );
                  // 장바구니 삭제 실패해도 구매는 완료된 것으로 처리
                }

                // 모달 닫힌 후 주문 완료 페이지로 이동
                setTimeout(() => {
                  // URL 파라미터로 모든 정보 전달
                  const params = new URLSearchParams({
                    receiptId: data.receipt_id,
                    orderId: ono.toString(),
                    totalAmount: subtotal.toString(),
                    itemCount: selected.length.toString(),
                  });

                  navigate(`/order/complete?${params.toString()}`);
                }, 2000);
              } catch (error) {
                console.error("결제 후 주문 저장 실패:", error);
                setModal({
                  open: true,
                  title: "주문 저장 실패",
                  content:
                    "결제 후 주문 저장에 실패했습니다.\n고객센터에 문의해주세요.",
                });
              }
            }, 1000); // 1초 후 완료 처리
            return true; // 결제 승인
          })
          .done((response) => {
            console.log("결제 완료 (done):", response);
            // confirm에서 이미 처리했으므로 여기서는 로그만
          })
          .close(() => {
            console.log("결제창 닫힘");
          });
      }
    } catch (error) {
      console.error("결제 요청 실패:", error);
      setModal({
        open: true,
        title: "결제 요청 실패",
        content: "결제 요청에 실패했습니다.\n다시 시도해주세요.",
      });
    }
  }, [sdkReady, subtotal, selected, loginState.email, navigate]);

  const closeModal = () => {
    setModal({ open: false, title: "", content: "" });
  };

  if (!isLogin) {
    return <div className="p-6">로그인 후 이용해주세요.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 max-w-4xl mx-auto">
        <section className="flex-1 bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold">
            주문 상품 ({filteredSelected.length})
          </h2>
          <ul className="mt-4 space-y-4">
            {filteredSelected.map((it) => (
              <li key={it.pno} className="flex items-center border-b pb-2">
                <img
                  src={`/api/products/view/${it.imageFile}`}
                  alt={it.pname}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="ml-4 flex-1">
                  <div className="font-medium">{it.pname}</div>
                  <div className="text-sm text-gray-600">수량: {it.qty}</div>
                </div>
                <div className="font-semibold">
                  {((it.salePrice || it.price) * it.qty).toLocaleString()}원
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="w-full lg:w-80 bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold">결제 금액</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>상품 합계</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between font-bold pt-2">
              <span>총 결제</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
          </div>
          <button
            onClick={handlePayment}
            disabled={!sdkReady}
            className={`mt-6 w-full py-2 text-white rounded ${
              sdkReady
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {sdkReady ? " 결제하기" : "결제 SDK 로딩중..."}
          </button>
          {!sdkReady && (
            <div className="mt-2 text-sm text-gray-500 text-center">
              SDK 로딩 중... 잠시만 기다려주세요.
            </div>
          )}
        </aside>
      </div>

      {/* 모달 */}
      {modal.open && (
        <ResultModal
          title={modal.title}
          content={modal.content}
          callbackFn={closeModal}
        />
      )}
    </div>
  );
}
