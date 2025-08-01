import React, { useEffect, useState, useRef } from "react";
import { getRecentList } from "../../api/donationBoardApi";
import { API_SERVER_HOST } from "../../api/backendApi";
import { Link } from "react-router-dom";
import "./RecentPostsSlider.css";

function HorizontalCarousel({
  items,
  visibleCount = 4,
  autoPlay = true,
  showControls = true,
}) {
  const originalSlides = items;
  const extendedSlides = [...originalSlides, ...originalSlides]; // 반복용
  const [idx, setIdx] = useState(originalSlides.length); // 중간부터 시작
  const [isTransitioning, setIsTransitioning] = useState(false);
  const trackRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const idxRef = useRef(idx);

  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  const next = () => {
    setIdx((i) => i + 1);
    setIsTransitioning(true);
  };

  const prev = () => {
    setIdx((i) => i - 1);
    setIsTransitioning(true);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const itemWidth = track.children[0]?.offsetWidth || 0;
    const itemMarginRight = 16; // mr-4
    const w = itemWidth + itemMarginRight;

    track.style.transition = isTransitioning ? "transform 0.5s ease" : "none";
    track.style.transform = `translateX(-${idx * w}px)`;
  }, [idx, isTransitioning]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleTransitionEnd = () => {
      const currentIdx = idxRef.current;
      if (currentIdx >= extendedSlides.length - visibleCount) {
        setIsTransitioning(false);
        setIdx(originalSlides.length); // 점프
      } else if (currentIdx <= 0) {
        setIsTransitioning(false);
        setIdx(extendedSlides.length - 2 * visibleCount);
      } else {
        setIsTransitioning(false);
      }
    };

    track.addEventListener("transitionend", handleTransitionEnd);
    return () => {
      track.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, [extendedSlides.length, originalSlides.length, visibleCount]);

  useEffect(() => {
    if (!autoPlay || isHovered || items.length <= visibleCount) return;

    const interval = setInterval(() => {
      next();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, isHovered, items.length, visibleCount]);

  if (items.length === 0) return null;

  return (
    <div
      className="horizontal-carousel-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showControls && (
        <button className="carousel-button carousel-button-prev" onClick={prev}>
          &lt;
        </button>
      )}
      <div className="carousel-viewport">
        <div className="carousel-track flex" ref={trackRef}>
          {extendedSlides.map((it, i) => (
            <div
              className="carousel-card mr-4"
              key={`${it.tno}-${i}`}
              style={{ width: `calc(100% / ${visibleCount})` }}
            >
              <Link to={`/donationBoard/read/${it.tno}`}>
                <div className="card-link-wrapper">
                  <div className="card-image-wrapper">
                    {it.uploadFileNames && it.uploadFileNames.length > 0 ? (
                      <img
                        src={`${API_SERVER_HOST}/files/s_${it.uploadFileNames[0]}`}
                        alt={it.title}
                        className="card-image"
                      />
                    ) : (
                      <div className="card-no-image">이미지 없음</div>
                    )}
                  </div>
                  {/* 제목과 작성자 텍스트 제거 */}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      {showControls && (
        <button className="carousel-button carousel-button-next" onClick={next}>
          &gt;
        </button>
      )}
    </div>
  );
}

// RecentPostsSlider 컴포넌트
const RecentPostsSlider = ({ onDonateClick }) => {
  const [recentPosts, setRecentPosts] = useState([]);

  useEffect(() => {
    getRecentList().then((data) => {
      if (Array.isArray(data)) {
        setRecentPosts(data);
      } else {
        console.error("API 응답 형식이 올바르지 않습니다.");
        setRecentPosts([]);
      }
    });
  }, []);

  if (recentPosts.length === 0) return null;

  return (
    <div className="recent-posts-slider-container">
      <div className="recent-posts-header">
        <h2 className="recent-posts-title">최신 기부 스토리</h2>
        {onDonateClick && (
          <button className="donation-donate-button" onClick={onDonateClick}>
            기부하기
          </button>
        )}
      </div>
      <HorizontalCarousel
        items={recentPosts}
        visibleCount={3}
        autoPlay={true}
      />
    </div>
  );
};

export default RecentPostsSlider;
