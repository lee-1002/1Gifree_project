import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import CompleteComponent from "../../components/order/CompleteComponent";

const CompletePage = () => {
  const { state } = useLocation();

  console.log("CompletePage state:", state); // 디버깅용 로그

  // 페이지 로드 시 한 번만 자동 새로고침
  useEffect(() => {
    // URL에 파라미터가 있는지 확인
    const urlParams = new URLSearchParams(window.location.search);
    const hasParams = urlParams.has("receiptId") || urlParams.has("orderId");

    // 이미 새로고침했는지 확인
    const hasRefreshed = localStorage.getItem("completePageRefreshed");

    // 파라미터가 있고 아직 새로고침하지 않았으면 새로고침
    if (hasParams && !hasRefreshed) {
      localStorage.setItem("completePageRefreshed", "true");
      setTimeout(() => {
        window.location.reload();
      }, 100); // 100ms 후 새로고침
    } else {
      // 새로고침 플래그 제거 (다음 결제를 위해)
      localStorage.removeItem("completePageRefreshed");
    }
  }, []);

  return (
    <div>
      <CompleteComponent></CompleteComponent>
    </div>
  );
};

export default CompletePage;
