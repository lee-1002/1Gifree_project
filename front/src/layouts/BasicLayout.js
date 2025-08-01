import { Link, Outlet } from "react-router-dom";
import { useEffect } from "react";
import BasicMenu from "../components/menus/BasicMenu";
import SideMenu from "../components/menus/SideMenu"; // SideMenu를 BasicLayout에서 직접 임포트
import { SearchProvider } from "../context/SearchContext";

const BasicLayout = () => {
  // 결제창을 띄우는 함수
  const openPaymentWindow = (product) => {
    console.log("메인 창에서 openPaymentWindow 호출됨:", product);

    // BootPay SDK가 로드되어 있는지 확인
    const bootpay = window.BootPay || window.bootpay || window.Bootpay;
    console.log("메인 창에서 BootPay SDK 확인:", bootpay);

    if (!bootpay) {
      console.log("메인 창에서 BootPay SDK 로드 시작");
      // BootPay SDK가 없으면 로드
      const script = document.createElement("script");
      script.src = "https://cdn.bootpay.co.kr/js/bootpay-3.2.3.min.js";
      script.onload = () => {
        console.log("메인 창에서 BootPay SDK 로드 완료");
        // SDK 로드 후 결제창 띄우기
        setTimeout(() => openPaymentWindow(product), 500);
      };
      script.onerror = (error) => {
        console.error("메인 창에서 BootPay SDK 로드 실패:", error);
        alert(
          "결제 시스템을 초기화할 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요."
        );
      };
      document.head.appendChild(script);
      return;
    }

    console.log("메인 창에서 결제창 띄우기 시작");

    try {
      // 결제창 띄우기
      const paymentRequest = bootpay.request({
        application_id: "6880972a836e97280fee7b0b", // 실제 결제용 Application ID
        price: product.price,
        name: `${product.brand} ${product.name}`,
        method: "card",
        order_id: `order_${Date.now()}`,
        user_info: {
          username: "user@example.com",
          email: "user@example.com",
        },
        extra: {
          test_verification: true,
        },
      });

      console.log("메인 창에서 결제 요청 생성됨:", paymentRequest);

      // 체이닝 방식으로 처리
      if (paymentRequest && typeof paymentRequest.error === "function") {
        paymentRequest
          .error((error) => {
            console.error("메인 창에서 결제 에러:", error);
            alert(
              `❌ 결제 중 오류가 발생했습니다: ${
                error.message || "알 수 없는 오류"
              }`
            );
          })
          .cancel(() => {
            console.log("메인 창에서 결제 취소됨");
            alert("❌ 결제가 취소되었습니다.");
          })
          .confirm((data) => {
            console.log("메인 창에서 결제 확인됨:", data);
            alert(
              `🎉 결제 완료!\n\n${product.brand} ${
                product.name
              } 구매가 성공적으로 완료되었습니다!\n\n결제 금액: ${product.price.toLocaleString()}원\n주문번호: ${
                data.receipt_id || `order_${Date.now()}`
              }`
            );
          })
          .done((response) => {
            console.log("메인 창에서 결제 완료 (done):", response);
          })
          .close(() => {
            console.log("메인 창에서 결제창 닫힘");
          });
      } else {
        // Promise 방식으로 처리
        paymentRequest
          .then(async (response) => {
            console.log("메인 창에서 결제 완료:", response);
            alert(
              `🎉 결제 완료!\n\n${product.brand} ${
                product.name
              } 구매가 성공적으로 완료되었습니다!\n\n결제 금액: ${product.price.toLocaleString()}원\n주문번호: ${
                response.receipt_id || `order_${Date.now()}`
              }`
            );
          })
          .catch((error) => {
            console.error("메인 창에서 결제 실패:", error);
            alert("❌ 결제에 실패했습니다. 다시 시도해주세요.");
          });
      }
    } catch (error) {
      console.error("메인 창에서 결제창 띄우기 실패:", error);
      alert("❌ 결제창을 띄울 수 없습니다. 다시 시도해주세요.");
    }
  };

  // 챗봇으로부터 결제 요청을 받는 이벤트 리스너
  useEffect(() => {
    const handleMessage = (event) => {
      // React DevTools 메시지 필터링
      if (
        event.data &&
        event.data.source &&
        event.data.source.includes("react-devtools")
      ) {
        return; // React DevTools 메시지는 무시
      }

      console.log("메인 창에서 메시지 수신:", event.data);
      console.log("메시지 타입:", event.data?.type);
      console.log("메시지 출처:", event.origin);

      if (event.data && event.data.type === "OPEN_PAYMENT") {
        console.log("챗봇으로부터 결제 요청 받음:", event.data.product);
        console.log(
          "결제 상품 정보:",
          JSON.stringify(event.data.product, null, 2)
        );

        // 즉시 결제창 띄우기 (1초 대기 제거)
        console.log("메인 창에서 결제창 띄우기 시작");
        openPaymentWindow(event.data.product);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener("message", handleMessage);
    console.log("메인 창에서 메시지 리스너 등록 완료");

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <SearchProvider>
      <div className="container mx-auto">
        {/* 또는 gap-x-0.5 등으로 줄이기 (조금 떨어짐) */}
        <div className="grid grid-cols-10 gap-x-2">
          {" "}
          {/* BasicMenu 영역 */}
          <div className="col-span-10 md:col-span-8 md:col-start-2">
            <BasicMenu />
          </div>
          {/* 메인 콘텐츠 영역 */}
          <main className="col-span-10 md:col-span-8 md:col-start-2 py-5">
            <Outlet />
          </main>
          {/* SideMenu 영역 */}
          <aside className="col-span-2 md:block md:sticky md:top-5 md:self-start">
            <SideMenu />
          </aside>
        </div>
      </div>
      {/* 3. footer를 container 밖으로 이동시킵니다. */}
      <footer className="w-full bg-gray-800 text-gray-300 py-8 text-sm mt-10">
        <div className="container mx-auto text-center">
          <p className="font-bold text-lg text-white mb-2">Gifree</p>
          <div className="flex justify-center space-x-6 mb-4">
            <Link to="/terms" className="hover:text-white">
              이용약관
            </Link>
            <Link to="/privacy" className="hover:text-white">
              개인정보처리방침
            </Link>
            <Link to="/contact" className="hover:text-white">
              고객센터
            </Link>
          </div>
          <p>
            기프리 주식회사 | 대표: 코딩파트너 | 사업자등록번호: 123-45-67890
          </p>
          <p>주소: 서울특별시 어딘가 | 이메일: contact@gifree.com</p>
          <p className="mt-4 text-gray-500">
            © 2025 Gifree Inc. All Rights Reserved.
          </p>
        </div>
      </footer>
    </SearchProvider>
  );
};

export default BasicLayout;
