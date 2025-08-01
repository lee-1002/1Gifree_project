import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../slices/loginSlice";
import jwtAxios from "../../util/jwtUtil";
import { API_SERVER_HOST } from "../../api/backendApi";
import ResultModal from "../common/ResultModal";

const MyPageComponent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loginState = useSelector((state) => state.loginSlice || {});

  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState([]);
  const [collectionLoading, setCollectionLoading] = useState(true);
  const [donationHistory, setDonationHistory] = useState([]);
  const [donationLoading, setDonationLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, msg: "" });
  const [activeSection, setActiveSection] = useState("collection-section");

  // 무한 스크롤을 위한 상태
  const [collectionPage, setCollectionPage] = useState(0);
  const [donationPage, setDonationPage] = useState(0);
  const [orderPage, setOrderPage] = useState(0);
  const [hasMoreCollection, setHasMoreCollection] = useState(true);
  const [hasMoreDonation, setHasMoreDonation] = useState(true);
  const [hasMoreOrder, setHasMoreOrder] = useState(true);

  const host = API_SERVER_HOST;

  useEffect(() => {
    if (loginState.email) {
      console.log("현재 로그인 상태:", loginState);
      console.log("현재 사용자 권한:", loginState.roleNames);
      loadOrderHistoryWithAutoFix();
      loadCollection();
      loadDonationHistory();
    }
  }, [loginState.email]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "collection-section",
        "donation-section",
        "order-section",
      ];

      const scrollPosition = window.scrollY + 200; // 약간의 오프셋

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const sectionTop = section.offsetTop;
          if (scrollPosition >= sectionTop) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 무한 스크롤을 위한 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute("data-section");
            if (
              section === "collection" &&
              hasMoreCollection &&
              !collectionLoading
            ) {
              const nextPage = collectionPage + 1;
              setCollectionPage(nextPage);
              loadCollection(nextPage, true);
            } else if (
              section === "donation" &&
              hasMoreDonation &&
              !donationLoading
            ) {
              const nextPage = donationPage + 1;
              setDonationPage(nextPage);
              loadDonationHistory(nextPage, true);
            } else if (section === "order" && hasMoreOrder && !loading) {
              const nextPage = orderPage + 1;
              setOrderPage(nextPage);
              loadOrderHistoryWithAutoFix(nextPage, true);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const sentinels = document.querySelectorAll("[data-section]");
    sentinels.forEach((sentinel) => observer.observe(sentinel));

    return () => {
      sentinels.forEach((sentinel) => observer.unobserve(sentinel));
    };
  }, [
    collectionPage,
    donationPage,
    orderPage,
    hasMoreCollection,
    hasMoreDonation,
    hasMoreOrder,
    collectionLoading,
    donationLoading,
    loading,
  ]);

  const loadOrderHistoryWithAutoFix = async (page = 0, append = false) => {
    try {
      if (page === 0) {
        setLoading(true);
      }
      const response = await jwtAxios.get(
        `${API_SERVER_HOST}/api/order/history?page=${page}&size=12`
      );
      console.log("주문 내역 응답:", response.data);

      const newData = response.data.content || response.data || [];

      if (append) {
        setOrderHistory((prev) => [...prev, ...newData]);
      } else {
        setOrderHistory(newData);
      }

      setHasMoreOrder(newData.length === 12);

      if (newData && newData.length > 0) {
        newData.forEach((order, index) => {
          console.log(`주문 ${index + 1}:`, {
            ono: order.ono,
            orderedAt: order.orderedAt,
            totalAmount: order.totalAmount,
            receiptId: order.receiptId,
            itemsCount: order.orderItems ? order.orderItems.length : 0,
          });

          if (order.orderItems) {
            order.orderItems.forEach((item, itemIndex) => {
              console.log(`  상품 ${itemIndex + 1}:`, {
                pname: item.pname,
                qty: item.qty,
                price: item.price,
                imageFile: item.imageFile,
              });
            });
          }
        });
      }
    } catch (error) {
      console.error("주문 내역 조회 실패:", error);
      if (!append) {
        setOrderHistory([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCollection = async (page = 0, append = false) => {
    try {
      if (page === 0) {
        setCollectionLoading(true);
      }
      const response = await jwtAxios.get(
        `${API_SERVER_HOST}/api/collection?page=${page}&size=12`
      );
      console.log("보관함 응답:", response.data);

      const newData = response.data.content || response.data || [];

      if (append) {
        setCollection((prev) => [...prev, ...newData]);
      } else {
        setCollection(newData);
      }

      setHasMoreCollection(newData.length === 12);
    } catch (error) {
      console.error("보관함 조회 실패:", error);
      if (!append) {
        setCollection([]);
      }
    } finally {
      setCollectionLoading(false);
    }
  };

  const loadDonationHistory = async (page = 0, append = false) => {
    try {
      if (page === 0) {
        setDonationLoading(true);
      }
      const response = await jwtAxios.get(
        `${API_SERVER_HOST}/api/donations/donor/${loginState.email}?page=${page}&size=12`
      );
      console.log("기부내역 응답:", response.data);

      const newData = response.data.content || response.data || [];

      if (append) {
        setDonationHistory((prev) => [...prev, ...newData]);
      } else {
        setDonationHistory(newData);
      }

      setHasMoreDonation(newData.length === 12);

      // 각 기부내역의 이미지 정보 로깅
      if (newData && newData.length > 0) {
        newData.forEach((donation, index) => {
          console.log(`기부 ${index + 1}:`, {
            dno: donation.dno,
            pname: donation.pname,
            brand: donation.brand,
            amount: donation.amount,
            count: donation.count,
            imageFile: donation.imageFile,
            createdAt: donation.createdAt,
          });
        });
      }

      setDonationHistory(response.data || []);
    } catch (error) {
      console.error("기부내역 조회 실패:", error);
      // 기부내역이 없을 수도 있으므로 에러를 무시하고 빈 배열로 설정
      setDonationHistory([]);
    } finally {
      setDonationLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/"); // 메인 화면으로 이동
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 기부 통계 계산
  const donationStats = useMemo(() => {
    const totalCount = donationHistory.reduce(
      (sum, donation) => sum + (donation.count || 0),
      0
    );
    const totalAmount = donationHistory.reduce(
      (sum, donation) => sum + (donation.amount || 0),
      0
    );
    return { totalCount, totalAmount };
  }, [donationHistory]);

  // 스크롤 이동 함수
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setActiveSection(sectionId);
  };

  if (!loginState.email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              로그인이 필요합니다
            </h1>
            <p className="text-gray-600 mb-6">
              마이페이지를 이용하려면 로그인해주세요.
            </p>
            <Link
              to="/member/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              로그인하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="mb-6 flex justify-center">
        <Link to="/" className="inline-block">
          <img src="/logo5.jpg" alt="Gifree 로고" className="h-[70px] w-auto" />
        </Link>
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-6">
          {/* 왼쪽 네비게이션 메뉴 */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                마이페이지
              </h2>
              <nav className="space-y-2">
                <button
                  onClick={() => scrollToSection("collection-section")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    activeSection === "collection-section"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span className="font-medium">보관함</span>
                </button>
                <button
                  onClick={() => scrollToSection("donation-section")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    activeSection === "donation-section"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span className="font-medium">기부내역</span>
                </button>
                <button
                  onClick={() => scrollToSection("order-section")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    activeSection === "order-section"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span className="font-medium">구매내역</span>
                </button>
              </nav>
            </div>
          </div>

          {/* 오른쪽 콘텐츠 영역 */}
          <div className="flex-1">
            {/* 하단 헤더 - 로그아웃 및 사용자 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    로그 아웃
                  </h1>
                  <p className="text-gray-600 mt-1">
                    안녕하세요,{" "}
                    <span className="font-semibold">{loginState.email}</span>님!
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            </div>

            {/* 보관함 */}
            <div
              id="collection-section"
              className="bg-white rounded-lg shadow-md p-6 mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                보관함
              </h2>

              {collectionLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">보관함을 불러오는 중...</p>
                </div>
              ) : collection.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    아직 보관함에 상품이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {collection.map((item) => (
                    <div
                      key={item.id || item.pno}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/selling/read/${item.pno}`)}
                    >
                      {item.uploadFileNames && (
                        <img
                          src={`${host}/api/products/view/s_${item.uploadFileNames}`}
                          alt={item.pname}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                          {item.brand && !item.pname.startsWith(item.brand)
                            ? `${item.brand} ${item.pname}`
                            : item.pname}
                        </h3>
                        <p className="text-lg font-bold text-blue-600 mb-2">
                          {item.price?.toLocaleString()}원
                        </p>
                        {item.source === "randombox" && (
                          <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            🎁 랜덤박스
                          </span>
                        )}
                        {item.source === "purchase" && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            📦 구매
                          </span>
                        )}
                        {item.addedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(item.addedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 보관함 무한 스크롤 sentinel */}
              {hasMoreCollection && (
                <div data-section="collection" className="h-4 mt-4" />
              )}
            </div>

            {/* 기부내역 */}
            <div
              id="donation-section"
              className="bg-white rounded-lg shadow-md p-6 mb-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  기부내역
                </h2>
                <div className="text-sm text-gray-600">
                  <span className="mr-4">
                    총 기부 횟수: {donationStats.totalCount}회
                  </span>
                  <span>
                    총 기부 금액: {donationStats.totalAmount?.toLocaleString()}
                    원
                  </span>
                </div>
              </div>
              {donationLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">
                    기부내역을 불러오는 중...
                  </p>
                </div>
              ) : donationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">아직 기부내역이 없습니다.</p>
                  <button
                    onClick={() => navigate("/donation")}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    기부하러 가기
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {donationHistory.map((donation) => (
                    <div
                      key={donation.dno}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start space-x-4">
                          {donation.imageFile ? (
                            <img
                              src={`${API_SERVER_HOST}/api/products/view/${donation.imageFile}`}
                              alt={donation.pname}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                console.log(
                                  "기부 이미지 로드 실패:",
                                  donation.imageFile
                                );
                                e.target.style.display = "none";
                                // 이미지 로드 실패 시 기본 아이콘 표시
                                e.target.nextSibling.style.display = "flex";
                              }}
                              onLoad={() => {
                                console.log(
                                  "기부 이미지 로드 성공:",
                                  donation.imageFile
                                );
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded flex items-center justify-center ${
                              donation.imageFile ? "hidden" : ""
                            }`}
                          ></div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              기부번호: {donation.dno}
                            </h3>
                            <p className="text-sm text-gray-600">
                              기부일: {formatDate(donation.createdAt)}
                            </p>
                            <p className="text-sm text-gray-600">
                              상품명: {donation.pname}
                            </p>
                            <p className="text-sm text-gray-600">
                              브랜드: {donation.brand}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-green-600">
                            {donation.amount?.toLocaleString()}원
                          </p>
                          <p className="text-sm text-gray-600">
                            수량: {donation.count}개
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 기부내역 무한 스크롤 sentinel */}
              {hasMoreDonation && (
                <div data-section="donation" className="h-4 mt-4" />
              )}
            </div>

            {/* 구매내역 */}
            <div
              id="order-section"
              className="bg-white rounded-lg shadow-md p-6 mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                구매내역
              </h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">
                    주문 내역을 불러오는 중...
                  </p>
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">아직 구매내역이 없습니다.</p>
                  <button
                    onClick={() => navigate("/selling/list")}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    쇼핑하러 가기
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderHistory.map((order) => (
                    <div
                      key={order.ono}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            주문번호: {order.ono}
                          </h3>
                          <p className="text-sm text-gray-600">
                            주문일: {formatDate(order.orderedAt)}
                          </p>
                          {order.receiptId && (
                            <p className="text-sm text-gray-600">
                              결제번호: {order.receiptId}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-blue-600">
                            총 {order.totalAmount?.toLocaleString() || 0}원
                          </p>
                        </div>
                      </div>

                      {/* 주문 상품 목록 */}
                      {order.orderItems && order.orderItems.length > 0 && (
                        <div className="border-t pt-3">
                          <h4 className="font-medium mb-2">구매 상품</h4>
                          <div className="space-y-2">
                            {order.orderItems.map((item, index) => {
                              console.log("상품 정보:", item); // 디버깅 로그
                              return (
                                <div
                                  key={index}
                                  className="flex items-center space-x-3"
                                >
                                  {item.imageFile && (
                                    <img
                                      src={`${host}/api/products/view/${item.imageFile}`}
                                      alt={item.pname}
                                      className="w-12 h-12 object-cover rounded"
                                      onError={(e) => {
                                        console.log(
                                          "이미지 로드 실패:",
                                          item.imageFile
                                        ); // 디버깅 로그
                                        e.target.style.display = "none";
                                      }}
                                      onLoad={() => {
                                        console.log(
                                          "이미지 로드 성공:",
                                          item.imageFile
                                        ); // 디버깅 로그
                                      }}
                                    />
                                  )}
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {item.pname}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      수량: {item.qty}개 | 단가:{" "}
                                      {item.price?.toLocaleString()}원
                                    </div>
                                    <div className="text-sm text-blue-600 font-medium">
                                      합계:{" "}
                                      {(item.price * item.qty).toLocaleString()}
                                      원
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 구매내역 무한 스크롤 sentinel */}
              {hasMoreOrder && (
                <div data-section="order" className="h-4 mt-4" />
              )}
            </div>
          </div>
        </div>
      </div>
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

export default MyPageComponent;
