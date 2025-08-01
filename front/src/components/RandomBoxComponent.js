import React, { useState, useEffect } from "react";
import "./RandomBoxComponent.css";
import { getList } from "../api/productsApi.js"; // getList를 임포트합니다.
import {
  addToCollection,
  getRandomBoxChances,
  consumeRandomBoxChance,
} from "../api/orderApi.js"; // 보관함 추가 API로 변경
import { API_SERVER_HOST } from "../api/backendApi"; // 이미지 경로를 위해 필요합니다.
import { useSelector } from "react-redux"; // Redux 상태 사용
import { useNavigate } from "react-router-dom"; // 네비게이션 사용
import { getCookie } from "../util/cookieUtil"; // 쿠키 유틸 추가
import ResultModal from "./common/ResultModal"; // 모달 컴포넌트 추가

const host = API_SERVER_HOST; // 이미지 호스트 정의

const ProbabilityIndicator = () => {
  return (
    <div className="probability-container">
      <div>10,000원 이하 상품만 나옵니다</div>
    </div>
  );
};

const ChanceIndicator = ({
  remainingChances,
  isLoadingChances,
  amountToNextChance,
}) => {
  return (
    <div className="chance-container">
      <div className="chance-title">🎯 남은 기회</div>
      {isLoadingChances ? (
        <div className="chance-loading">로딩 중...</div>
      ) : (
        <div className="chance-count">{remainingChances}회</div>
      )}
      <div className="chance-info">구매 10,000원당 1회 기회 획득!</div>

      {!isLoadingChances &&
        remainingChances === 0 &&
        amountToNextChance > 0 && (
          <div className="next-chance-info">
            <div className="next-chance-text">다음 기회까지</div>
            <div className="next-chance-amount">
              {amountToNextChance.toLocaleString()}원
            </div>
          </div>
        )}
    </div>
  );
};

const GachaButton = ({ onClick, isOpening, disabled }) => {
  return (
    <button
      className={`gacha-box ${isOpening ? "opening" : ""} ${
        disabled ? "disabled" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {isOpening ? "🎁 열고 있는 중..." : "📦 랜덤박스 열기!"}
    </button>
  );
};

const ItemCard = ({ item, isAdding, onViewCollection }) => {
  if (!item) {
    return (
      <div className="waiting-message">랜덤박스를 열어 상품을 확인하세요!</div>
    ); // 메시지 변경
  }

  return (
    <div className={`card`}>
      {/* 상품 이미지를 표시하려면 아래 주석을 해제하고 사용하세요. */}
      {item.uploadFileNames?.length > 0 && (
        <img
          alt="product"
          className="card-image" // CSS에 .card-image 스타일 추가 필요
          src={`${host}/api/products/view/s_${item.uploadFileNames[0]}`}
        />
      )}
      <div className="card-name">{item.pname}</div>
      <div className="card-description">{item.pdesc}</div>
      <div className="card-price">가격: {item.price.toLocaleString()} 원</div>

      {/* 보관함 추가 처리 중 메시지 */}
      {isAdding && (
        <div className="purchase-status">
          <div className="purchase-loading">보관함에 추가 중...</div>
          <div className="purchase-message">
            마이페이지 보관함에서 확인하실 수 있습니다!
          </div>
        </div>
      )}

      {/* 보관함 보기 버튼 */}
      {!isAdding && item && (
        <button className="view-purchase-button" onClick={onViewCollection}>
          보관함 보기
        </button>
      )}
    </div>
  );
};

const WaitingMessage = () => (
  <div className="waiting-message">상품이 나오고 있습니다...!</div>
);

const EmptyMessage = () => (
  <div className="empty-message">10,000원 이하 상품이 없습니다.</div> // 메시지 변경
);

const RandomBoxComponent = () => {
  const [currentItem, setCurrentItem] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [itemAdded, setItemAdded] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", content: "" });
  const [remainingChances, setRemainingChances] = useState(0);
  const [isLoadingChances, setIsLoadingChances] = useState(false);
  const [amountToNextChance, setAmountToNextChance] = useState(0);

  const loginState = useSelector((state) => state.loginSlice);
  const navigate = useNavigate();

  // 랜덤박스 기회 조회
  const loadRandomBoxChances = async () => {
    if (!loginState.email) return;

    setIsLoadingChances(true);
    try {
      const response = await getRandomBoxChances();
      setRemainingChances(response.data.remainingChances);
      setAmountToNextChance(response.data.amountToNextChance);
    } catch (error) {
      console.error("랜덤박스 기회 조회 실패:", error);
      setRemainingChances(0);
      setAmountToNextChance(0);
    } finally {
      setIsLoadingChances(false);
    }
  };

  // 로그인 상태가 변경될 때 기회 조회
  useEffect(() => {
    if (loginState.email) {
      loadRandomBoxChances();
    } else {
      setRemainingChances(0);
      setAmountToNextChance(0);
    }
  }, [loginState.email]);

  // 페이지 포커스 시 기회 다시 조회 (구매 후 기회 업데이트를 위해)
  useEffect(() => {
    const handleFocus = () => {
      if (loginState.email) {
        loadRandomBoxChances();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loginState.email]);

  const handleOpenBox = async () => {
    // 로그인 체크
    if (!loginState.email) {
      setModal({
        open: true,
        title: "로그인 필요",
        content: "랜덤박스를 이용하려면 로그인이 필요합니다.",
      });
      return;
    }

    // 기회 부족 체크
    if (remainingChances <= 0) {
      setModal({
        open: true,
        title: "기회 부족",
        content:
          "랜덤박스 기회가 부족합니다. 구매를 통해 기회를 얻으세요! (10,000원당 1회)",
      });
      return;
    }

    console.log("handleOpenBox 함수 호출됨");
    setIsOpening(true);
    setIsWaiting(true);
    setIsEmpty(false);
    setCurrentItem(null);
    setIsAdding(false);
    setItemAdded(false);

    try {
      // 랜덤박스 기회 사용
      const chanceResponse = await consumeRandomBoxChance();
      if (!chanceResponse.data.success) {
        setModal({
          open: true,
          title: "기회 부족",
          content: "랜덤박스 기회가 부족합니다. 구매를 통해 기회를 얻으세요!",
        });
        return;
      }

      // 기회 수 업데이트
      setRemainingChances(chanceResponse.data.remainingChances);

      // getList를 사용하여 상품 목록을 가져옵니다.
      // 여기서는 1페이지만 가져와서 그 중 하나를 랜덤으로 선택합니다.
      const response = await getList({ page: 1, size: 100 }); // 충분히 많은 상품을 가져오도록 size를 늘립니다.

      if (!response.dtoList || response.dtoList.length === 0) {
        setIsEmpty(true);
      } else {
        // 10,000원 이하 상품만 필터링
        const filteredProducts = response.dtoList.filter(
          (product) => product.price <= 10000
        );

        if (filteredProducts.length === 0) {
          setIsEmpty(true);
        } else {
          // 필터링된 상품 목록에서 랜덤으로 하나의 상품을 선택합니다.
          const randomIndex = Math.floor(
            Math.random() * filteredProducts.length
          );
          const randomProduct = filteredProducts[randomIndex];
          setCurrentItem(randomProduct);

          // 상품이 나오면 바로 보관함에 추가
          await handleAddToCollection(randomProduct);
        }
      }
    } catch (err) {
      // getList에서 발생할 수 있는 오류 처리
      setModal({
        open: true,
        title: "오류 발생",
        content: "상품 목록을 불러오는 데 실패했습니다.",
      });
      console.error("Failed to fetch product list:", err);
      setIsEmpty(true); // 에러 발생 시 비어있다고 표시
    } finally {
      setTimeout(() => {
        setIsOpening(false);
        setIsWaiting(false);
      }, 800);
    }
  };

  const handleAddToCollection = async (item) => {
    setIsAdding(true);

    try {
      // 토큰 가져오기
      const memberInfo = getCookie("member");
      const token = memberInfo?.accessToken;

      if (!token) {
        throw new Error("토큰이 없습니다. 다시 로그인해주세요.");
      }

      // 보관함에 추가할 상품 데이터
      const collectionData = {
        pno: item.pno,
        pname: item.pname,
        price: item.price,
        pdesc: item.pdesc,
        brand: item.brand,
        uploadFileNames:
          item.uploadFileNames && item.uploadFileNames.length > 0
            ? item.uploadFileNames[0]
            : null,
        source: "randombox", // 랜덤박스에서 추가됨을 표시
      };

      console.log("보관함 추가 데이터:", collectionData);

      // 보관함에 추가 API 호출
      const response = await addToCollection(collectionData);
      console.log("보관함 추가 성공:", response.data);

      setItemAdded(true);

      // 성공 모달 표시 (잠시 후)
      setTimeout(() => {
        setModal({
          open: true,
          title: "🎉 축하합니다!",
          content: `상품이 보관함에 추가되었습니다!\n\n${
            item.pname
          }\n가격: ${item.price.toLocaleString()}원\n\n마이페이지 보관함에서 확인하실 수 있습니다.`,
        });
      }, 3500);
    } catch (error) {
      console.error("보관함 추가 실패:", error);

      if (error.response?.status === 401) {
        setModal({
          open: true,
          title: "로그인 만료",
          content: "로그인이 만료되었습니다. 다시 로그인해주세요.",
        });
      } else {
        setModal({
          open: true,
          title: "추가 실패",
          content:
            "보관함에 추가하는 중 오류가 발생했습니다. 다시 시도해주세요.",
        });
      }
    } finally {
      // 추가 처리 완료 후 3초 뒤에 상품 초기화
      setTimeout(() => {
        setIsAdding(false);
        setItemAdded(false);
        setCurrentItem(null);
      }, 5000); // 5초로 늘림
    }
  };

  const handleViewCollection = () => {
    navigate("/member/mypage");
  };

  const closeModal = () => {
    setModal({ open: false, title: "", content: "" });
  };

  return (
    <div className="random-box-container">
      <div className="main-card">
        <h1 className="title">🎁 랜덤박스 열기</h1>

        <ProbabilityIndicator />
        <ChanceIndicator
          remainingChances={remainingChances}
          isLoadingChances={isLoadingChances}
          amountToNextChance={amountToNextChance}
        />

        <GachaButton
          onClick={handleOpenBox}
          isOpening={isOpening}
          disabled={isOpening}
        />

        <div className="card-result">
          {isWaiting ? (
            <WaitingMessage />
          ) : isEmpty ? (
            <EmptyMessage />
          ) : (
            <ItemCard
              item={currentItem}
              isAdding={isAdding}
              onViewCollection={handleViewCollection}
            />
          )}
        </div>
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
};

export default RandomBoxComponent;
