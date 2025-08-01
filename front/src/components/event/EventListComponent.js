import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatShortDate } from "../../util/dateUtil";
import { getEvents } from "../../api/eventApi";
import "./EventList.css";
import useCustomUserRoles from "../../hooks/useCustomUserRoles";

const IMAGE_BASE_URL = "http://localhost:8080/files";

const EventListComponent = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  // isAdmin, loading (권한 로딩 상태), error (권한 로딩 에러)를 가져옵니다.
  const { isAdmin, error: rolesError } = useCustomUserRoles();

  const navigate = useNavigate();
  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    loadEvents(currentPage);
  }, [currentPage]);

  const loadEvents = async (page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvents(page);
      console.log("서버에서 받은 이벤트 데이터:", data);

      // 수정: 더 엄격한 데이터 검증
      if (data && Array.isArray(data.dtoList)) {
        // active를 isActive로 변환하여 저장하고 정렬
        const eventsWithIsActive = data.dtoList.map((event) => ({
          ...event,
          isActive: event.active, // active 필드를 isActive로 변환
        }));

        // 활성화된 이벤트를 먼저, 비활성화된 이벤트를 나중에 정렬
        const sortedEvents = eventsWithIsActive.sort((a, b) => {
          // isActive가 true인 것을 먼저 (내림차순)
          if (a.isActive === b.isActive) {
            return 0; // 같으면 원래 순서 유지
          }
          return b.isActive - a.isActive; // true(1)가 false(0)보다 먼저
        });

        setEvents(sortedEvents);
        setPageInfo({
          pageNumList: data.pageNumList || [],
          prev: Boolean(data.prev),
          next: Boolean(data.next),
          prevPage: data.prevPage || 1,
          nextPage: data.nextPage || 1,
          current: data.current || 1,
          totalPage: data.totalPage || 1,
        });
      } else {
        setError("이벤트 데이터가 올바르지 않습니다.");
        setEvents([]);
      }
    } catch (err) {
      console.error("이벤트 로딩 오류:", err);
      setError("이벤트를 불러오는 데 실패했습니다.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate("/event/add");
  };

  // 수정: 이미지 오류 처리 함수 분리
  const handleImageError = (e) => {
    if (e.target.src.includes("thumb_event_noImage.jpg")) {
      return; // 이미 기본 이미지로 설정되어 있으면 더 이상 변경하지 않음
    }
    e.target.src =
      "https://img.sa.nexon.com/S2/Game/sudden/2011/temp/thumb_event_noImage.jpg";
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;
  if (rolesError)
    return <div>사용자 권한 정보를 불러오는 데 실패했습니다: {rolesError}</div>;

  return (
    <div className="event-container">
      <ul className="boardEventList">
        {events.length === 0 ? (
          <li>등록된 이벤트가 없습니다.</li>
        ) : (
          events.map((event) => (
            <li key={event.id}>
              {/* 수정: isActive 상태를 boolean으로 확인 */}
              <div className={`thumb ${!event.isActive ? "inactive" : ""}`}>
                <Link to={`/event/${event.id}`}>
                  <img
                    src={`${IMAGE_BASE_URL}/${event.imageUrl}`}
                    width="360"
                    height="134"
                    alt={event.title || "이벤트 이미지"}
                    onError={handleImageError}
                  />
                </Link>
              </div>
              <div className="data">
                <Link to={`/event/${event.id}`} className="title-link">
                  {event.title || "제목 없음"}
                </Link>
                <div className="event-date">
                  {event.startDate
                    ? formatShortDate(event.startDate)
                    : "시작일 미정"}{" "}
                  ~{" "}
                  {event.endDate
                    ? formatShortDate(event.endDate)
                    : "종료일 미정"}
                </div>
                <div className="txt ellipsis">
                  {event.description || "설명 없음"}
                </div>

                <div className="store-info">
                  <strong>가게명:</strong> {event.storeName || "정보 없음"}
                  <br />
                  <strong>주소:</strong> {event.storeAddress || "정보 없음"}
                </div>
              </div>
              <Link to={`/event/${event.id}`} className="btn_detail">
                <b>자세히 보기</b>
              </Link>
            </li>
          ))
        )}
      </ul>

      {/* 수정: 페이징 UI 조건 개선 */}
      {pageInfo.pageNumList && pageInfo.pageNumList.length > 0 && (
        <div className="pagination">
          {pageInfo.prev && (
            <button onClick={() => handlePageClick(pageInfo.prevPage)}>
              &laquo;
            </button>
          )}
          {pageInfo.pageNumList.map((num) => (
            <button
              key={num}
              onClick={() => handlePageClick(num)}
              className={num === pageInfo.current ? "active" : ""}
            >
              {num}
            </button>
          ))}
          {pageInfo.next && (
            <button onClick={() => handlePageClick(pageInfo.nextPage)}>
              &raquo;
            </button>
          )}
        </div>
      )}

      {isAdmin && <button onClick={handleAdd}>이벤트 추가</button>}
    </div>
  );
};

export default EventListComponent;
