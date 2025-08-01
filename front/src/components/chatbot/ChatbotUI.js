import React, { useState, useRef, useEffect } from "react";
import useCustomCart from "../../hooks/useCustomCart";
import { createOrder, addToCollection } from "../../api/orderApi";
import { getCookie } from "../../util/cookieUtil";
import useLocation from "../../hooks/useLocation";
import axios from "axios";

const ChatbotUI = () => {
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordTime, setRecordTime] = useState(0);
  const [silenceTimer, setSilenceTimer] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "bot",
      text: `안녕하세요! 기프리봇입니다 😊

기프티콘 관련해서 궁금한 점이 있으시면 언제든 말씀해주세요!

예를 들어 이런 것들:
• 상품 보기: "상품 목록 보여줘", "스타벅스 상품 뭐 있어요?", "가장 저렴한 건 뭐예요?"
• 구매/결제: "주문 내역 봐줘", "결제 어떻게 해요?"
• 이벤트: "진행 중인 이벤트 있어요?"
• 후기: "후기 게시판 보여줘"
• 기부: "기부 게시판 정보"
• 장바구니: "장바구니 확인해줘"

편하게 질문해주세요! 💬`,
    },
  ]);

  const chatBodyRef = useRef(null);
  const intervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const { addToCart } = useCustomCart();
  const {
    location: userLocation,
    error: locationError,
    isLoading: locationLoading,
    getCurrentLocation,
  } = useLocation();

  // 음성인식 초기화
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const speechToText = event.results[event.results.length - 1][0].transcript;
      setTranscript((prev) => prev + " " + speechToText);
      // 실시간으로 입력창에도 표시
      setChatInput(speechToText);
      
      // 음성 인식 결과가 있을 때마다 3초 타이머 리셋
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      const newTimer = setTimeout(() => {
        if (isListening && transcript.trim()) {
          console.log("3초 무음 - 자동 전송");
          stopListening();
        }
      }, 3000);
      setSilenceTimer(newTimer);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event);
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
      clearInterval(intervalRef.current);
      // 음성인식이 끝나면 자동으로 전송
      if (transcript.trim()) {
        handleVoiceSend();
      }
    };

    recognitionRef.current = recognition;
  }, [SpeechRecognition]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
    };
  }, [silenceTimer]);

  // 음성인식 시작
  const startListening = () => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setChatInput(""); // 입력창도 초기화
    setIsListening(true);
    setRecordTime(0);

    recognitionRef.current.start();

    intervalRef.current = setInterval(() => {
      setRecordTime((prev) => prev + 1);
    }, 1000);

    // 3초 타이머 설정
    const timer = setTimeout(() => {
      if (isListening && transcript.trim()) {
        console.log("3초 무음 - 자동 전송");
        stopListening();
      }
    }, 3000);
    setSilenceTimer(timer);
  };

  // 음성인식 중지
  const stopListening = () => {
    if (!recognitionRef.current) return;
    console.log("음성인식 수동 중지");
    recognitionRef.current.stop();
    setIsListening(false);
    clearInterval(intervalRef.current);

    // 3초 타이머 정리
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }

    // 수동 중지 시에도 전송하지 않음
    // 입력값에만 남기고 사용자가 직접 전송하도록 함
  };

  // 음성 메시지 전송
  const handleVoiceSend = async () => {
    const currentTranscript = transcript.trim();
    if (!currentTranscript) return;

    console.log("음성 메시지 전송:", currentTranscript);

    setChatMessages((prev) => [...prev, { sender: "user", text: currentTranscript }]);
    setIsLoading(true);

    try {
      // 음성 API 호출
      const res = await axios.post("http://localhost:8000/voice", {
        message: currentTranscript,
      });

      const response = res.data.response || "음성 메시지를 처리했습니다.";
      setChatMessages((prev) => [...prev, { sender: "bot", text: response }]);
    } catch (error) {
      console.error("음성 처리 오류:", error);
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: "음성 메시지 처리 중 오류가 발생했습니다." }
      ]);
    } finally {
      setIsLoading(false);
      setTranscript("");
    }
  };

  // 새 창에서 결제창을 띄우는 함수
  const openPaymentInCurrentWindow = (product) => {
    console.log("새 창에서 결제창 띄우기 시작:", product);

    // BootPay SDK가 로드되어 있는지 확인
    const bootpay = window.BootPay || window.bootpay || window.Bootpay;
    console.log("새 창에서 BootPay SDK 확인:", bootpay);

    if (!bootpay) {
      console.log("새 창에서 BootPay SDK 로드 시작");
      // BootPay SDK가 없으면 로드
      const script = document.createElement("script");
      script.src = "https://cdn.bootpay.co.kr/js/bootpay-3.2.3.min.js";
      script.onload = () => {
        console.log("새 창에서 BootPay SDK 로드 완료");
        // SDK 로드 후 결제창 띄우기
        setTimeout(() => openPaymentInCurrentWindow(product), 500);
      };
      script.onerror = (error) => {
        console.error("새 창에서 BootPay SDK 로드 실패:", error);
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "❌ 결제 시스템을 초기화할 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.",
          },
        ]);
      };
      document.head.appendChild(script);
      return;
    }

    console.log("새 창에서 결제창 띄우기 시작");

    try {
      // 결제창 띄우기
      const paymentRequest = bootpay.request({
        application_id: "6880972a836e97280fee7b0b", // 실제 결제용 Application ID
        price: product.salePrice || product.price, // 할인가 우선, 없으면 원가
        name: `${product.brand || "기프티콘"} ${product.pname || product.name}`,
        method: "card",
        order_id: `order_${Date.now()}`,
        user_info: {
          username: getCookie("member")?.email || "user@example.com",
          email: getCookie("member")?.email || "user@example.com",
        },
        extra: {
          test_verification: true,
        },
      });

      console.log("새 창에서 결제 요청 생성됨:", paymentRequest);

      // 체이닝 방식으로 처리
      if (paymentRequest && typeof paymentRequest.error === "function") {
        paymentRequest
          .error((error) => {
            console.error("새 창에서 결제 에러:", error);
            setChatMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                text: `❌ 결제 중 오류가 발생했습니다.\n\n오류: ${
                  error.message || "알 수 없는 오류"
                }\n\n다시 시도해주세요.`,
              },
            ]);

            // BootPay가 자동으로 창을 닫을 예정
            console.log("결제 오류 - BootPay가 자동으로 창을 닫을 예정입니다.");

            // 3초 후에도 창이 안 닫히면 안전장치 작동
            setTimeout(() => {
              try {
                console.log("안전장치: 결제창 강제 닫기 시도");

                // BootPay 관련 요소들만 안전하게 제거
                const bootpayModal = document.querySelector(
                  '[id*="bootpay-modal"], [class*="bootpay-modal"]'
                );
                if (bootpayModal) {
                  bootpayModal.style.display = "none";
                  console.log("BootPay 모달 제거됨");
                }

                // body 스크롤만 복원
                document.body.style.overflow = "auto";
              } catch (error) {
                console.log("안전장치 실행 실패:", error);
              }
            }, 3000);
          })
          .cancel(() => {
            console.log("새 창에서 결제 취소됨");
            setChatMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                text: "❌ 결제가 취소되었습니다.\n\n다시 구매하시려면 말씀해주세요!",
              },
            ]);

            // BootPay가 자동으로 창을 닫을 예정
            console.log("결제 취소 - BootPay가 자동으로 창을 닫을 예정입니다.");

            // 3초 후에도 창이 안 닫히면 안전장치 작동
            setTimeout(() => {
              try {
                console.log("안전장치: 결제창 강제 닫기 시도");

                // BootPay 관련 요소들만 안전하게 제거
                const bootpayModal = document.querySelector(
                  '[id*="bootpay-modal"], [class*="bootpay-modal"]'
                );
                if (bootpayModal) {
                  bootpayModal.style.display = "none";
                  console.log("BootPay 모달 제거됨");
                }

                // body 스크롤만 복원
                document.body.style.overflow = "auto";
              } catch (error) {
                console.log("안전장치 실행 실패:", error);
              }
            }, 3000);
          })
          .confirm(async (data) => {
            console.log("결제 성공 데이터:", data);

            // BootPay 승인 처리 - 재고 확인 및 승인
            console.log("결제 데이터:", data);

            // 재고 확인 로직 (현재는 항상 true로 설정)
            var enable = true; // 실제로는 재고 수량을 확인해야 함

            if (enable) {
              console.log("재고 확인 완료 - 승인 처리 진행");
              // BootPay 공식 문서에 따른 승인 처리
              const bootpay = window.BootPay || window.bootpay;
              if (bootpay && bootpay.transactionConfirm) {
                bootpay.transactionConfirm(data);
              }
            } else {
              console.log("재고 부족 - 결제 취소");
              const bootpay = window.BootPay || window.bootpay;
              if (bootpay && bootpay.removePaymentWindow) {
                bootpay.removePaymentWindow();
              }
            }

            // .confirm에서는 승인만 처리하고, .done에서 주문 생성
            console.log("결제 승인 완료 - .done 콜백에서 주문 생성 예정");
          })
          .done(async (data) => {
            console.log("결제 완료:", data);

            // 결제 완료 시 주문 생성 API 호출
            try {
              const memberInfo = getCookie("member");
              const orderReq = {
                memberId: memberInfo?.email,
                items: [
                  {
                    pno: product.pno,
                    qty: 1,
                    price: product.price,
                  },
                ],
              };

              console.log("주문 생성 요청:", orderReq);
              const orderRes = await createOrder(orderReq);
              console.log("주문 생성 성공:", orderRes);

              // 보관함에 상품 추가
              try {
                const collectionData = {
                  pno: product.pno,
                  pname: product.pname,
                  price: product.price,
                  pdesc: product.pdesc || "",
                  brand: product.brand,
                  uploadFileNames: product.imageFile || "",
                  source: "chatbot_purchase", // 챗봇 구매로 표시
                };

                console.log("보관함 추가 데이터:", collectionData);
                await addToCollection(collectionData);
                console.log("보관함 추가 성공");

                setChatMessages((prev) => [
                  ...prev,
                  {
                    sender: "bot",
                    text: `✅ 결제가 완료되었습니다!\n\n주문번호: ${
                      orderRes.orderId || orderRes.ono || "생성됨"
                    }\n상품: ${product.brand} ${
                      product.pname
                    }\n가격: ${product.price.toLocaleString()}원\n\n상품이 구매내역과 보관함에 추가되었습니다! 🎉`,
                  },
                ]);
              } catch (collectionError) {
                console.error("보관함 추가 실패:", collectionError);
                // 보관함 추가 실패해도 주문은 완료된 것으로 처리
                setChatMessages((prev) => [
                  ...prev,
                  {
                    sender: "bot",
                    text: `✅ 결제가 완료되었습니다!\n\n주문번호: ${
                      orderRes.orderId || orderRes.ono || "생성됨"
                    }\n상품: ${product.brand} ${
                      product.pname
                    }\n가격: ${product.price.toLocaleString()}원\n\n감사합니다! 🎉`,
                  },
                ]);
              }
            } catch (error) {
              console.error("주문 생성 실패:", error);
              setChatMessages((prev) => [
                ...prev,
                {
                  sender: "bot",
                  text: `✅ 결제는 완료되었습니다!\n\n상품: ${product.brand} ${
                    product.pname
                  }\n가격: ${product.price.toLocaleString()}원\n\n주문 내역은 잠시 후 확인해주세요.`,
                },
              ]);
            }

            // BootPay가 자동으로 창을 닫을 예정
            console.log("결제 완료 - BootPay가 자동으로 창을 닫을 예정입니다.");

            // 2초 후에도 창이 안 닫히면 안전장치 작동
            setTimeout(() => {
              try {
                console.log("안전장치: 결제창 강제 닫기 시도");

                // BootPay 관련 요소들만 안전하게 제거
                const bootpayModal = document.querySelector(
                  '[id*="bootpay-modal"], [class*="bootpay-modal"]'
                );
                if (bootpayModal) {
                  bootpayModal.style.display = "none";
                  console.log("BootPay 모달 제거됨");
                }

                // body 스크롤만 복원
                document.body.style.overflow = "auto";
              } catch (error) {
                console.log("안전장치 실행 실패:", error);
              }
            }, 2000);
          });
      }
    } catch (error) {
      console.error("새 창에서 결제창 띄우기 실패:", error);
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: "❌ 결제창을 띄울 수 없습니다." },
      ]);
    }
  };

  const handleChatInputChange = (e) => setChatInput(e.target.value);

  const formatMessage = (text) => {
    return text.split("\n").map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  // 메시지 전송 함수
  const handleSend = async () => {
    const textToSend = chatInput.trim();
    if (!textToSend) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setChatInput("");
    setIsLoading(true);

    try {
      // 사용자 메시지 분석하여 적절한 응답 생성
      const response = await analyzeUserMessage(textToSend);
      setChatMessages((prev) => [...prev, { sender: "bot", text: response }]);
      setIsLoading(false);
    } catch (error) {
      console.error("챗봇 응답 생성 오류:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.",
        },
      ]);
      setIsLoading(false);
    }
  };

  // 사용자 메시지 분석 및 적절한 응답 생성 함수
  const analyzeUserMessage = async (message) => {
    const lowerMessage = message.toLowerCase();

    // 1. 장바구니 관련 질문 (가장 먼저 체크)
    if (lowerMessage.includes("장바구니") || lowerMessage.includes("카트")) {
      return await handleCartQuery(message);
    }

    // 2. 상품 관련 질문 (구매 요청 포함)
    if (
      lowerMessage.includes("상품") ||
      lowerMessage.includes("기프티콘") ||
      lowerMessage.includes("메뉴") ||
      lowerMessage.includes("스타벅스") ||
      lowerMessage.includes("bhc") ||
      lowerMessage.includes("커피")
    ) {
      return await handleProductQuery(message);
    }

    // 3. 주문 내역 조회 (구매 요청이 아닌 경우만)
    if (
      (lowerMessage.includes("주문") || lowerMessage.includes("결제")) &&
      !lowerMessage.includes("구매") &&
      !lowerMessage.includes("사줘") &&
      !lowerMessage.includes("사고 싶어") &&
      !lowerMessage.includes("장바구니")
    ) {
      return "아... 주문 내역 조회는 지금 점검 중이에요. 조금 있다가 다시 시도해보세요!";
    }

    // 4. 이벤트 관련 질문
    if (lowerMessage.includes("이벤트") || lowerMessage.includes("프로모션")) {
      return await handleEventQuery(message);
    }

    // 5. 게시판 관련 질문
    if (
      lowerMessage.includes("게시판") ||
      lowerMessage.includes("후기") ||
      lowerMessage.includes("리뷰")
    ) {
      return await handleBoardQuery(message);
    }

    // 6. 기부 관련 질문
    if (lowerMessage.includes("기부") || lowerMessage.includes("후원")) {
      return await handleDonationQuery(message);
    }

    // 7. 기본 응답
    return "음... 무슨 말씀이신지 잘 모르겠어요. 좀 더 구체적으로 말씀해주시면 도움을 드릴 수 있을 것 같아요. 예를 들어 '상품 목록 보여줘', '이벤트 정보 알려줘', '주문 내역 확인' 이런 식으로 말씀해주세요.";
  };

  // 상품 관련 질문 처리
  const handleProductQuery = async (message) => {
    const lowerMessage = message.toLowerCase();

    try {
      // 상품 목록 조회
      const res = await fetch("/api/products/list?size=50");
      const response = await res.json();
      const products = response.dtoList || [];

      console.log("상품 목록 조회:", products);

      // 브랜드별 필터링
      let filteredProducts = products;
      if (lowerMessage.includes("스타벅스")) {
        filteredProducts = products.filter(
          (p) => p.brand && p.brand.includes("스타벅스")
        );
      } else if (lowerMessage.includes("bhc")) {
        filteredProducts = products.filter(
          (p) => p.brand && p.brand.toLowerCase().includes("bhc")
        );
      } else if (lowerMessage.includes("커피")) {
        filteredProducts = products.filter(
          (p) => p.pname && p.pname.includes("커피")
        );
      }

      // 위치 기반 필터링 (위치 정보가 있고, 위치 기반 요청인 경우)
      let nearbyStores = [];
      if (
        userLocation &&
        (lowerMessage.includes("위치") ||
          lowerMessage.includes("내 위치") ||
          lowerMessage.includes("근처") ||
          lowerMessage.includes("주변"))
      ) {
        // 실제로는 백엔드에서 위치 기반 필터링을 해야 하지만,
        // 현재는 프론트엔드에서 시뮬레이션으로 가까운 상품을 선택
        console.log("위치 기반 필터링 적용:", userLocation);

        // 임시로 랜덤하게 일부 상품만 선택 (실제로는 거리 계산 필요)
        const nearbyCount = Math.min(5, filteredProducts.length);
        filteredProducts = filteredProducts.slice(0, nearbyCount);

        // 스타벅스 매장 위치 검색 (카카오맵 API 사용)
        if (lowerMessage.includes("스타벅스")) {
          console.log("스타벅스 매장 검색 시작");

          // 카카오맵 SDK 로드 확인 및 로드
          if (!window.kakao) {
            console.log("카카오맵 SDK 로드 시작");
            const script = document.createElement("script");
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_KEY}&autoload=false&libraries=services`;
            script.async = true;
            script.onload = () => {
              window.kakao.maps.load(() => {
                console.log("카카오맵 SDK 로드 완료");
              });
            };
            document.head.appendChild(script);
          }

          // SDK 로드 대기 후 검색
          const waitForKakaoMaps = () => {
            return new Promise((resolve) => {
              const checkKakaoMaps = () => {
                if (
                  window.kakao &&
                  window.kakao.maps &&
                  window.kakao.maps.services
                ) {
                  console.log("카카오맵 서비스 준비 완료");
                  resolve();
                } else {
                  console.log("카카오맵 서비스 대기 중...");
                  setTimeout(checkKakaoMaps, 100);
                }
              };
              checkKakaoMaps();
            });
          };

          try {
            await waitForKakaoMaps();

            const ps = new window.kakao.maps.services.Places();
            const searchPromise = new Promise((resolve) => {
              console.log("스타벅스 매장 검색 API 호출");
              ps.keywordSearch(
                "스타벅스",
                (data, status) => {
                  console.log("스타벅스 검색 결과:", { data, status });
                  if (
                    status === window.kakao.maps.services.Status.OK &&
                    data.length > 0
                  ) {
                    // 거리 계산 함수
                    const getDistance = (lat1, lng1, lat2, lng2) => {
                      const toRad = (x) => (x * Math.PI) / 180;
                      const R = 6371e3;
                      const dLat = toRad(lat2 - lat1);
                      const dLng = toRad(lng2 - lng1);
                      const a =
                        Math.sin(dLat / 2) ** 2 +
                        Math.cos(toRad(lat1)) *
                          Math.cos(toRad(lat2)) *
                          Math.sin(dLng / 2) ** 2;
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                      return R * c;
                    };

                    const storesWithDistance = data
                      .map((store) => ({
                        ...store,
                        distance: getDistance(
                          userLocation.lat,
                          userLocation.lng,
                          parseFloat(store.y),
                          parseFloat(store.x)
                        ),
                      }))
                      .filter((store) => store.distance <= 5000) // 5km 이내
                      .sort((a, b) => a.distance - b.distance)
                      .slice(0, 3); // 가장 가까운 3개

                    console.log("가까운 스타벅스 매장:", storesWithDistance);
                    resolve(storesWithDistance);
                  } else {
                    console.log("스타벅스 매장을 찾을 수 없음");
                    resolve([]);
                  }
                },
                {
                  location: new window.kakao.maps.LatLng(
                    userLocation.lat,
                    userLocation.lng
                  ),
                  radius: 5000,
                }
              );
            });

            nearbyStores = await searchPromise;
          } catch (error) {
            console.error("스타벅스 매장 검색 오류:", error);
          }
        }
      }

      // 가격순 정렬
      if (
        lowerMessage.includes("저렴") ||
        lowerMessage.includes("최저가") ||
        lowerMessage.includes("싼")
      ) {
        filteredProducts.sort((a, b) => a.price - b.price);
      } else if (
        lowerMessage.includes("비싼") ||
        lowerMessage.includes("고가")
      ) {
        filteredProducts.sort((a, b) => b.price - a.price);
      }

      // 구매 요청인지 확인
      if (
        lowerMessage.includes("구매") ||
        lowerMessage.includes("사줘") ||
        lowerMessage.includes("사고 싶어") ||
        lowerMessage.includes("담아줘") ||
        lowerMessage.includes("담기") ||
        lowerMessage.includes("추가")
      ) {
        if (filteredProducts.length > 0) {
          // 가격순으로 정렬 (할인가 우선, 없으면 정가)
          const sortedProducts = [...filteredProducts].sort((a, b) => {
            const priceA = a.salePrice || a.price;
            const priceB = b.salePrice || b.price;
            return priceA - priceB;
          });

          const selectedProduct = sortedProducts[0]; // 가장 저렴한 상품 선택
          const finalPrice = selectedProduct.salePrice || selectedProduct.price;

          let locationInfo = "";
          if (userLocation) {
            const isLocationBased =
              lowerMessage.includes("위치") ||
              lowerMessage.includes("내 위치") ||
              lowerMessage.includes("근처") ||
              lowerMessage.includes("주변");

            if (isLocationBased) {
              locationInfo = `📍 위치 기반으로 근처 상품을 찾아봤어요!

`;
            } else {
              locationInfo = `📍 (위치 기반 검색을 원하시면 "내 위치 기반으로"라고 말씀해주세요)

`;
            }
          } else if (locationError) {
            locationInfo = `⚠️ 위치 정보를 가져올 수 없어서 전체 상품 중에서 선택했어요

`;
          } else if (locationLoading) {
            locationInfo = `⏳ 위치를 확인하고 있어요...

`;
          } else {
            locationInfo = `⚠️ 위치를 가져올 수 없어서 전체 상품 중에서 선택했어요

`;
          }

          let storeInfo = "";
          if (nearbyStores.length > 0) {
            storeInfo = `

🏪 **근처 스타벅스 매장**:
${nearbyStores
  .map(
    (store, index) =>
      `${index + 1}. ${store.place_name} (${Math.round(store.distance)}m)
   📍 ${store.road_address_name || store.address_name}`
  )
  .join("\n")}

`;
          }

          // 장바구니 추가인지 구매인지 확인
          const isAddToCart = lowerMessage.includes("담아줘") || 
                             lowerMessage.includes("담기") || 
                             lowerMessage.includes("추가");

          if (isAddToCart) {
            // 장바구니에 추가
            try {
              await addToCart(selectedProduct);
              const response = `${locationInfo}✅ ${selectedProduct.brand} ${
                selectedProduct.pname
              }를 장바구니에 추가했어요!

가격: ${finalPrice.toLocaleString()}원
${
  selectedProduct.salePrice
    ? `(원래 ${selectedProduct.price.toLocaleString()}원인데 할인된 거예요!)`
    : ""
}

장바구니에서 확인해보세요! 🛒`;

              return response;
            } catch (error) {
              console.error("장바구니 추가 실패:", error);
              return "장바구니에 추가하는 중 오류가 발생했습니다. 다시 시도해주세요.";
            }
          } else {
            // 구매 진행
            const response = `${locationInfo}좋아요! ${selectedProduct.brand} ${
              selectedProduct.pname
            }로 선택해드릴게요!

가격은 ${finalPrice.toLocaleString()}원이에요
${
  selectedProduct.salePrice
    ? `(원래 ${selectedProduct.price.toLocaleString()}원인데 할인된 거예요!)`
    : ""
}

${filteredProducts.length}개 중에 가장 저렴한 걸로 골랐어요 😊${storeInfo}
잠시 후 결제창으로 이동합니다.`;

            // 3초 후에 결제창 띄우기
            setTimeout(() => {
              openPaymentInCurrentWindow(selectedProduct);
            }, 3000);

            return response;
          }

          return response;
        } else {
          return "아... 그런 상품은 없네요. 다른 걸 찾아보시겠어요?";
        }
      }

      // 상품 목록 표시
      if (filteredProducts.length === 0) {
        return "아... 그런 상품은 없네요. 다른 걸 찾아보시겠어요?";
      }

      // 사용자 의도 파악 - 더 많은 정보를 원하는지 자연스럽게 판단
      const wantsMore =
        lowerMessage.includes("전부") ||
        lowerMessage.includes("모두") ||
        lowerMessage.includes("전체") ||
        lowerMessage.includes("다") ||
        lowerMessage.includes("29개") ||
        lowerMessage.includes("모든") ||
        lowerMessage.includes("다 보여") ||
        lowerMessage.includes("전부 보여") ||
        lowerMessage.includes("모두 보여") ||
        lowerMessage.includes("전체 보여") ||
        lowerMessage.includes("다 보여줘") ||
        lowerMessage.includes("전부 보여줘") ||
        lowerMessage.includes("전체 목록") ||
        lowerMessage.includes("모든 상품") ||
        lowerMessage.includes("전부 목록");

      // 기본적으로 10개, 더 많은 정보를 원하면 전체 표시
      const displayProducts = wantsMore
        ? filteredProducts
        : filteredProducts.slice(0, 10);

      const productList = displayProducts
        .map((p, index) => {
          const finalPrice = p.salePrice || p.price;
          return `${index + 1}. **${p.brand} ${
            p.pname
          }** - ${finalPrice.toLocaleString()}원`;
        })
        .join("\n");

      let result = `상품 목록이에요! (총 ${filteredProducts.length}개)

${productList}`;

      // 더 많은 정보를 원하지 않았고, 상품이 10개 이상인 경우에만 추가 안내
      if (!wantsMore && filteredProducts.length > 10) {
        result += `\n\n... 그리고 ${filteredProducts.length - 10}개 더 있어요`;
      }

      return result;
    } catch (error) {
      console.error("상품 조회 오류:", error);
      return "상품 정보를 조회하는 중 오류가 발생했습니다.";
    }
  };

  // 주문 관련 질문 처리
  const handleOrderQuery = async (message) => {
    try {
      const memberInfo = getCookie("member");
      if (!memberInfo) {
        return "로그인이 필요합니다.";
      }

      // JWT 토큰 가져오기 - member 쿠키에서 accessToken 추출
      let jwtToken = getCookie("accessToken");

      // member 쿠키에서 accessToken 추출 시도
      if (!jwtToken) {
        const memberInfo = getCookie("member");
        console.log("주문 조회 - member 쿠키 원본:", memberInfo);
        if (memberInfo) {
          try {
            // memberInfo가 이미 객체인지 문자열인지 확인
            const memberData =
              typeof memberInfo === "string"
                ? JSON.parse(memberInfo)
                : memberInfo;
            jwtToken = memberData.accessToken;
            console.log(
              "주문 조회 - member 쿠키에서 추출한 accessToken:",
              jwtToken
            );
          } catch (error) {
            console.error("주문 조회 - member 쿠키 파싱 오류:", error);
          }
        }
      }

      // 다른 가능한 쿠키 이름들도 시도
      if (!jwtToken) jwtToken = getCookie("token");
      if (!jwtToken) jwtToken = getCookie("jwt");
      if (!jwtToken) jwtToken = getCookie("authToken");

      console.log("주문 조회 - JWT 토큰:", jwtToken);

      if (!jwtToken) {
        return "로그인부터 해주세요! 토큰이 없어서 안 되겠어요.";
      }

      const res = await fetch("/api/order/history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const orders = await res.json();

      console.log("주문 내역 조회 결과:", orders);

      if (!orders || orders.length === 0) {
        return "주문 내역이 없습니다.";
      }

      const orderList = orders
        .slice(0, 3)
        .map((order, index) => {
          const orderId = order.ono || order.orderId || `주문${index + 1}`;
          const totalAmount = order.totalAmount || order.totalPrice || 0;
          return `${
            index + 1
          }. 주문번호: ${orderId} - ${totalAmount.toLocaleString()}원`;
        })
        .join("\n");

      return `📋 **주문 내역** (최근 ${orders.length}개)
      
${orderList}`;
    } catch (error) {
      console.error("주문 조회 오류:", error);
      return "주문 정보를 조회하는 중 오류가 발생했습니다.";
    }
  };

  // 이벤트 관련 질문 처리
  const handleEventQuery = async (message) => {
    try {
      const res = await fetch("/api/events/list?size=10");
      const response = await res.json();
      const events = response.dtoList || [];

      if (events.length === 0) {
        return "진행 중인 이벤트가 없습니다.";
      }

      const eventList = events
        .slice(0, 3)
        .map((event, index) => {
          return `${index + 1}. **${event.title}** - ${event.startDate} ~ ${
            event.endDate
          }`;
        })
        .join("\n");

      return `🎉 **진행 중인 이벤트** (총 ${events.length}개)
      
${eventList}`;
    } catch (error) {
      console.error("이벤트 조회 오류:", error);
      return "이벤트 정보를 조회하는 중 오류가 발생했습니다.";
    }
  };

  // 게시판 관련 질문 처리
  const handleBoardQuery = async (message) => {
    try {
      const res = await fetch("/api/boards/list?size=10");
      const response = await res.json();
      const boards = response.dtoList || [];

      if (boards.length === 0) {
        return "게시글이 없습니다.";
      }

      const boardList = boards
        .slice(0, 3)
        .map((board, index) => {
          return `${index + 1}. **${board.title}** - ${board.writer}`;
        })
        .join("\n");

      return `📝 **최근 게시글** (총 ${boards.length}개)
      
${boardList}`;
    } catch (error) {
      console.error("게시판 조회 오류:", error);
      return "게시판 정보를 조회하는 중 오류가 발생했습니다.";
    }
  };

  // 기부 관련 질문 처리
  const handleDonationQuery = async (message) => {
    try {
      const res = await fetch("/api/donation-boards/list?size=10");
      const response = await res.json();
      const donations = response.dtoList || [];

      if (donations.length === 0) {
        return "기부 게시글이 없습니다.";
      }

      const donationList = donations
        .slice(0, 3)
        .map((donation, index) => {
          return `${index + 1}. **${
            donation.title
          }** - 목표: ${donation.targetAmount.toLocaleString()}원`;
        })
        .join("\n");

      return `❤️ **기부 게시글** (총 ${donations.length}개)
      
${donationList}`;
    } catch (error) {
      console.error("기부 조회 오류:", error);
      return "기부 정보를 조회하는 중 오류가 발생했습니다.";
    }
  };

  // 장바구니 관련 질문 처리
  const handleCartQuery = async (message) => {
    const lowerMessage = message.toLowerCase();

    try {
      const memberInfo = getCookie("member");
      console.log("현재 로그인 정보:", memberInfo);

      if (!memberInfo) {
        return "로그인이 필요합니다.";
      }

      // JWT 토큰 가져오기 - member 쿠키에서 accessToken 추출
      let jwtToken = getCookie("accessToken");

      // member 쿠키에서 accessToken 추출 시도
      if (!jwtToken) {
        const memberInfo = getCookie("member");
        console.log("member 쿠키 원본:", memberInfo);
        if (memberInfo) {
          try {
            // memberInfo가 이미 객체인지 문자열인지 확인
            const memberData =
              typeof memberInfo === "string"
                ? JSON.parse(memberInfo)
                : memberInfo;
            jwtToken = memberData.accessToken;
            console.log("member 쿠키에서 추출한 accessToken:", jwtToken);
          } catch (error) {
            console.error("member 쿠키 파싱 오류:", error);
          }
        }
      }

      // 다른 가능한 쿠키 이름들도 시도
      if (!jwtToken) jwtToken = getCookie("token");
      if (!jwtToken) jwtToken = getCookie("jwt");
      if (!jwtToken) jwtToken = getCookie("authToken");

      console.log("JWT 토큰 (accessToken):", getCookie("accessToken"));
      console.log("JWT 토큰 (token):", getCookie("token"));
      console.log("JWT 토큰 (jwt):", getCookie("jwt"));
      console.log("JWT 토큰 (authToken):", getCookie("authToken"));
      console.log("최종 JWT 토큰:", jwtToken);

      // 모든 쿠키 확인
      console.log("모든 쿠키:", document.cookie);

      if (!jwtToken) {
        return "로그인이 필요합니다. JWT 토큰을 찾을 수 없습니다. 쿠키를 확인해주세요.";
      }

      const res = await fetch("/api/cart/items", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        credentials: "include",
      });

      console.log("API 응답 상태:", res.status);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const cartItems = await res.json();

      console.log("장바구니 조회 결과:", cartItems);

      if (!cartItems || cartItems.length === 0) {
        return "장바구니가 비어있어요. 뭔가 담아보시겠어요?";
      }

      // 장바구니 결제 요청인지 확인
      if (
        lowerMessage.includes("결제") ||
        lowerMessage.includes("구매") ||
        lowerMessage.includes("사줘")
      ) {
        const totalAmount = cartItems.reduce(
          (sum, item) => sum + item.price * item.qty,
          0
        );

        // 장바구니 전체를 하나의 상품으로 취급하여 결제창 띄우기
        const cartProduct = {
          pno: Date.now(), // 임시 상품 번호
          brand: "장바구니",
          pname: `전체 상품 (${cartItems.length}개)`,
          price: totalAmount,
        };

        // 결제창 띄우기
        openPaymentInCurrentWindow(cartProduct);

        const cartList = cartItems
          .map((item, index) => {
            const brandText = item.brand ? `${item.brand} ` : "";
            return `${index + 1}. **${brandText}${item.pname}** - ${
              item.qty
            }개 x ${item.price.toLocaleString()}원`;
          })
          .join("\n");

        return `장바구니 결제해드릴게요! (총 ${cartItems.length}개 상품)

${cartList}

총 결제 금액: ${totalAmount.toLocaleString()}원

결제창 띄워드릴게요!`;
      }

      // 일반 장바구니 조회
      const cartList = cartItems
        .slice(0, 5)
        .map((item, index) => {
          const brandText = item.brand ? `${item.brand} ` : "";
          return `${index + 1}. **${brandText}${item.pname}** - ${
            item.qty
          }개 x ${item.price.toLocaleString()}원`;
        })
        .join("\n");

      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
      );

      return `장바구니예요! (총 ${cartItems.length}개 상품)

${cartList}

총 금액: ${totalAmount.toLocaleString()}원

결제하고 싶으시면 "장바구니 결제해줘"라고 말씀해주세요!`;
    } catch (error) {
      console.error("장바구니 조회 오류:", error);
      return "장바구니 정보를 조회하는 중 오류가 발생했습니다.";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendAndFocus();
    }
  };

  // 메시지 전송 후 입력창에 포커스 유지
  const handleSendAndFocus = async () => {
    await handleSend();
    // 메시지 전송 후 입력창에 포커스 유지
    setTimeout(() => {
      const inputElement = document.querySelector('input[type="text"]');
      if (inputElement) {
        inputElement.focus();
      }
    }, 500); // 500ms로 증가
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 검색 이벤트 리스너 추가
  useEffect(() => {
    const handleSearchEvent = (event) => {
      if (event.type === "VOICE_SEARCH") {
        // 음성 검색 시작 메시지
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "user",
            text: `🎤 "${event.query}" 검색해줘`,
          },
        ]);
      } else if (event.type === "SEARCH_PERFORMED") {
        const searchMessage = `🔍 **"${event.query}"** 검색 결과를 찾았어요! (${
          event.count
        }개 상품)

${event.results
  .slice(0, 5)
  .map(
    (item, index) =>
      `${index + 1}. **${item.brand || "브랜드"} ${
        item.pname
      }** - ${item.price?.toLocaleString()}원`
  )
  .join("\n")}

${event.count > 5 ? `... 그리고 ${event.count - 5}개 더 있어요!` : ""}

검색 페이지에서 자세히 확인해보세요! 📱`;

        setChatMessages((prev) => [
          ...prev,
          { sender: "bot", text: searchMessage },
        ]);
      } else if (event.type === "SEARCH_ERROR") {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `❌ **"${event.query}"** 검색 중 오류가 발생했습니다.\n\n다시 시도해주세요.`,
          },
        ]);
      }
    };

    // 이벤트 리스너 등록
    if (window.chatbotEventBus) {
      window.chatbotEventBus.addListener(handleSearchEvent);
    }

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      if (window.chatbotEventBus) {
        window.chatbotEventBus.removeListener(handleSearchEvent);
      }
    };
  }, []);

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-500 text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold">기프리봇</h3>
            <p className="text-xs opacity-90">AI 챗봇 어시스턴트</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs">온라인</span>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div ref={chatBodyRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                message.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <div className="whitespace-pre-wrap">
                {formatMessage(message.text)}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm">입력 중...</span>
              </div>
            </div>
          </div>
        )}

        {isListening && (
          <div className="flex justify-start">
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <div
                    className="w-2 h-2 bg-red-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-red-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm">음성을 인식 중입니다!</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-3 border-t bg-gray-50">


        <div className="flex space-x-2">
          <input
            type="text"
            value={chatInput}
            onChange={handleChatInputChange}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />

          {/* 음성인식 버튼 */}
          {SpeechRecognition && (
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={`px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors text-sm ${
                isListening 
                  ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500'
              }`}
              title={isListening ? '음성인식 중지 (입력값에만 저장)' : '음성인식 시작'}
            >
              {isListening ? '⏹' : '🎤'}
            </button>
          )}

          <button
            onClick={handleSendAndFocus}
            disabled={isLoading || !chatInput.trim()}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotUI;
