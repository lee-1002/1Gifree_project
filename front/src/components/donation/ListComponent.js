import { useCallback, useEffect, useState } from "react";
import { getList, getRecentList } from "../../api/donationBoardApi";
import useCustomMove from "../../hooks/useCustomMove";
import PageComponent from "../common/PageComponent";
import { API_SERVER_HOST } from "../../api/backendApi";
import RecentPostsSlider from "./RecentPostsSlider";
import useCustomUserRoles from "../../hooks/useCustomUserRoles";
import useCustomLogin from "../../hooks/useCustomLogin";
import DonationModalComponent from "./DonationModalComponent";
import "./ListComponent.css";
import { useNavigate } from "react-router-dom";

const initState = {
  dtoList: [],
  pageNumList: [],
  pageRequestDTO: null,
  prev: false,
  next: false,
  totalCount: 0,
  prevPage: 0,
  nextPage: 0,
  totalPage: 0,
  current: 0,
};

const IMAGE_BASE_URL = `${API_SERVER_HOST}/files`;

// 카테고리 옵션 정의 (기타 제거)
const categoryOptions = [
  { value: "", label: "전체" },
  { value: "LOW_INCOME_CHILDREN", label: "저소득층 아동/청소년 지원" },
  { value: "ANIMAL_SHELTER", label: "유기동물 보호소 후원" },
  { value: "LOW_INCOME_WOMEN", label: "저소득층 여성 청소년" },
  { value: "SINGLE_MOTHER", label: "양육 독립가정" },
];

const getPlainText = (htmlString) => {
  if (!htmlString) return "";
  // 정규식을 사용해 모든 HTML 태그를 제거
  const plainText = htmlString.replace(/<[^>]*>?/gm, "").trim();
  // 추출된 텍스트가 비어있으면 null을 반환
  return plainText || null;
};

const ListComponent = () => {
  const {
    page: movePage,
    size,
    refresh,
    moveToList,
    moveToRead,
  } = useCustomMove();
  const [serverData, setServerData] = useState(initState);
  const [recentPosts, setRecentPosts] = useState([]);
  const navigate = useNavigate();
  const { isAdmin } = useCustomUserRoles();
  const { isLogin } = useCustomLogin();
  const [modalOpen, setModalOpen] = useState(false);

  // URL에서 파라미터 읽기
  const urlParams = new URLSearchParams(window.location.search);
  const [selectedCategory, setSelectedCategory] = useState(
    urlParams.get("category") || ""
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(urlParams.get("page")) || 1
  );

  const handleClickAdd = useCallback(() => {
    navigate({ pathname: "add" });
  }, [navigate]);

  const handleDonateClick = useCallback(() => {
    console.log("🔍 기부하기 버튼 클릭:");
    console.log("- isLogin:", isLogin);
    console.log("- isAdmin:", isAdmin);

    if (!isLogin) {
      console.log("❌ 로그인되지 않음 - 로그인 페이지로 이동");
      alert("로그인이 필요합니다.");
      navigate("/member/login");
      return;
    }

    console.log("✅ 로그인됨 - 기부 모달 열기");
    setModalOpen(true);
  }, [isLogin, navigate]);



  const handleCategoryChange = useCallback(
    (e) => {
      const category = e.target.value;
      setSelectedCategory(category);
      setCurrentPage(1); // 카테고리 변경 시 첫 페이지로
      // 카테고리가 변경되면 첫 페이지로 이동하고 URL 업데이트
      const params = new URLSearchParams();
      if (category) {
        params.set("category", category);
      }
      params.set("page", "1");
      params.set("size", "12");
      navigate(`/donationBoard?${params.toString()}`);
    },
    [navigate]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        let data;
        if (selectedCategory) {
          // 카테고리별 조회
          console.log(
            "카테고리별 조회 시작:",
            selectedCategory,
            "페이지:",
            currentPage
          );
          const response = await fetch(
            `${API_SERVER_HOST}/api/donationBoard/category?page=${currentPage}&size=12&category=${selectedCategory}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          data = await response.json();
          console.log("카테고리별 조회 응답:", data);
        } else {
          // 전체 조회
          console.log("전체 조회 시작, 페이지:", currentPage);
          data = await getList({ page: currentPage, size: 12 });
          console.log("전체 조회 응답:", data);
        }

        console.log("API 응답 데이터:", data);

        // PageResponseDTO 형식 확인
        if (data && data.dtoList && Array.isArray(data.dtoList)) {
          // 빈 아이템 자동 채우기 로직 제거
          setServerData({ ...data, dtoList: data.dtoList });
        } else {
          console.error(
            "API 응답 형식이 예상과 다릅니다. dtoList가 없거나 배열이 아닙니다:",
            data
          );
          setServerData(initState);
        }
      } catch (error) {
        console.error("데이터를 가져오는 중 오류 발생:", error);
        setServerData(initState);
      }
    };

    fetchData();
  }, [currentPage, size, refresh, selectedCategory]);

  // URL 변경 감지하여 상태 업데이트
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newCategory = urlParams.get("category") || "";
    const newPage = parseInt(urlParams.get("page")) || 1;

    if (newCategory !== selectedCategory) {
      setSelectedCategory(newCategory);
    }
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  }, [window.location.search]);

  useEffect(() => {
    getRecentList()
      .then((data) => {
        if (Array.isArray(data)) {
          setRecentPosts(data);
        } else {
          console.error("최신 게시글 응답 형식이 올바르지 않습니다.");
          setRecentPosts([]);
        }
      })
      .catch((error) => {
        console.error("최신 게시글 목록을 가져오는 중 오류 발생:", error);
        // 이 에러가 401 Unauthorized 에러입니다.
        setRecentPosts([]);
      });
  }, []);

  return (
    <>
      <div className="donationBoard-main-iamge-box">
        <img src={"donationBoardMain.jpg"} alt="기부 페이지 메인 이미지" />
        <div className="index-container">
          <div className="donation-story-title-container">
            <div className="donation-story-title">기부 스토리</div>
            <div className="donation-story-title-sub">
              작은 기부, 큰 변화의 시작
            </div>
          </div>
        </div>
      </div>

      <div className="recent-posts-section">
        <RecentPostsSlider onDonateClick={handleDonateClick} />
      </div>

      {isAdmin && (
        <div className="admin-button-container">
          <button className="donation-write-button" onClick={handleClickAdd}>
            글쓰기 (관리자)
          </button>
        </div>
      )}

      {/* 카테고리 탭 필터 - 굿네이버스 스타일 */}
      <div className="category-tab-container">
        <ul className="tab-area">
          {categoryOptions.map((option, index) => (
            <li
              key={option.value}
              id={`tab${index + 1}`}
              rel={`tab${index + 1}`}
              className={selectedCategory === option.value ? "ac_tit" : ""}
            >
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleCategoryChange({ target: { value: option.value } });
                }}
              >
                {option.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <DonationModalComponent
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      <div className="donation-board-container">
        <div className="donation-list-wrap">
          {serverData.dtoList.length > 0 ? (
            serverData.dtoList.map((donationBoard) => (
              <div
                key={donationBoard.tno}
                className="donation-item"
                onClick={() => moveToRead(donationBoard.tno, "/donationBoard")}
              >
                {/* 이미지를 위한 컨테이너 (위쪽에 배치) */}
                <div className="donation-image-container">
                  {donationBoard.uploadFileNames &&
                  donationBoard.uploadFileNames.length > 0 ? (
                    <img
                      src={`${IMAGE_BASE_URL}/s_${donationBoard.uploadFileNames[0]}`}
                      alt={donationBoard.title}
                      className="donation-image"
                    />
                  ) : (
                    <div className="no-image-placeholder">
                      <span>이미지</span>
                    </div>
                  )}
                </div>

                {/* 텍스트를 위한 컨테이너 (아래쪽에 배치) */}
                <div className="donation-text-container">
                  <div className="donation-board-title">
                    {donationBoard.title}
                  </div>
                  <div className="donation-board-context">
                    {donationBoard.content &&
                      getPlainText(donationBoard.content)}
                  </div>
                  {/* 카테고리 표시 */}
                  {donationBoard.category && (
                    <div className="donation-category">
                      {categoryOptions.find(
                        (opt) => opt.value === donationBoard.category
                      )?.label || donationBoard.category}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-data-message">첫번째 기부자가 되어주세요!</div>
          )}
        </div>
        <PageComponent
          serverData={serverData}
          movePage={(pageObj) => {
            const pageNum = pageObj.page;
            console.log("movePage 호출, pageNum:", pageNum);

            // currentPage 상태 업데이트
            setCurrentPage(pageNum);

            // 페이지네이션 시에도 카테고리 정보 유지
            const params = new URLSearchParams();
            if (selectedCategory) {
              params.set("category", selectedCategory);
            }
            params.set("page", pageNum.toString());
            params.set("size", "12");
            navigate(`/donationBoard?${params.toString()}`);
          }}
        ></PageComponent>
      </div>
    </>
  );
};
export default ListComponent;
