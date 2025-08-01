import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./GraphComponent.css";
import { getEvents } from "../api/eventApi";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const BASE_BACKEND_URL = "http://localhost:8080";

const GraphComponent = () => {
  const [input, setInput] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [listData, setListData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  //   const [showResults, setShowResults] = useState(false);
  //   const [showAnalysisResults, setShowAnalysisResults] = useState(false); // 분석 결과 표시 여부

  const handleSearch = async (searchTerm) => {
    // 검색어가 비어있거나 로딩 중이면 실행하지 않음
    if (!searchTerm || !searchTerm.trim() || isLoading) return;

    setIsLoading(true);
    setError("");
    setImageSrc("");
    setListData([]);

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        // 포트 번호 확인!
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: searchTerm }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "분석 데이터를 가져오는데 실패했습니다."
        );
      }

      const data = await response.json();
      setImageSrc(`data:image/png;base64,${data.graphImage}`);
      setListData(data.listData);
    } catch (err) {
      console.error("분석 요청 중 에러:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    handleSearch("기부 횟수");
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEvents(1);
        if (data?.dtoList) {
          // 활성화된 이벤트만 필터링
          const activeEvents = data.dtoList.filter((event) => event.active);
          setEvents(activeEvents);
        }
      } catch (err) {
        console.error("이벤트 목록 가져오기 실패:", err);
      }
    };

    fetchEvents();
  }, []);
  const handleNextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const handlePrevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  return (
    <div className="ad-graph-list-container">
      {/* 광고 및 이벤트 이미지 */}
      <div className="ad-container">
        {events.length > 0 ? (
          <div className="ad-image-wrapper">
            <Link to={`/event/${events[currentIndex].id}`}>
              <img
                src={`${BASE_BACKEND_URL}/files/${events[currentIndex].imageUrl}`}
                alt={events[currentIndex].title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://img.sa.nexon.com/S2/Game/sudden/2011/temp/thumb_event_noImage.jpg";
                }}
              />
            </Link>
            <button className="arrow-button left" onClick={handlePrevImage}>
              <FaChevronLeft />
            </button>
            <button className="arrow-button right" onClick={handleNextImage}>
              <FaChevronRight />
            </button>
            {/* 도트 인디케이터 여기! */}
            <div className="dots-wrapper">
              {events.map((_, index) => (
                <div
                  key={index}
                  className={`dot ${currentIndex === index ? "active" : ""}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <p>이벤트 이미지를 불러오는 중...</p>
        )}
      </div>
      <div className="graph-list-container">
        {/* 그래프 */}
        <div className="graph-container">
          <h2>📊궁금한 정보를 검색해보세요</h2>
          <div className="input-group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ex) 기부 금액 순위"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(input); // input 상태값을 인자로 전달
                }
              }}
            />
            <button onClick={() => handleSearch(input)} disabled={isLoading}>
              {isLoading ? "검색중..." : "검색"}
            </button>
          </div>

          {/* --- 결과 표시 영역 --- */}
          <div className="results-container">
            {isLoading && <p>그래프와 목록을 생성 중입니다...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* 그래프 표시 */}
            {imageSrc && (
              <div className="graph-display">
                <img src={imageSrc} alt="분석 그래프" />
              </div>
            )}
          </div>
        </div>

        {/* 명단 리스트(표) 표시 */}
        {listData.length > 0 && (
          <div className="list-container">
            <p>상위 10위</p>
            <div className="list-container-table">
              <div className="list-container-table-head">
                <div className="div-table-cell rank-cell">순위</div>
                <div className="div-table-cell name-cell">기부자</div>
              </div>
              <div className="div-table-body">
                {listData.map((item, index) => (
                  <div className="div-table-row" key={index}>
                    {/* item 객체의 '순위'와 '기부자명' 값을 직접 사용합니다. */}
                    <div className="div-table-cell rank-cell">{`${item.순위}위`}</div>
                    <div className="div-table-cell name-cell">
                      {item.기부자명}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphComponent;
