// src/pages/MainPage.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./MainComponent.css";
import GraphComponent from "../components/GraphComponent";
import { getList } from "../api/productsApi";
import { API_SERVER_HOST } from "../api/backendApi";
import useCustomLogin from "../hooks/useCustomLogin";

// 상품 섹션 정의
const PRODUCT_SECTIONS = [
  { name: "주간 Best", emoji: "🔥", type: "best" },
  { name: "신상품", emoji: "🆕", type: "new" },
  { name: "추천 상품", emoji: "⭐", type: "recommended" },
  { name: "로컬 인기", emoji: "🏪", type: "local" },
];

const HOT_DEAL_LIMIT = 6;
const SECTION_BATCH = 2;

// --- HorizontalCarousel 컴포넌트 ---
function HorizontalCarousel({
  items,
  visibleCount = 4,
  autoPlay = false,
  showControls = true,
}) {
  const count = items.length;
  const slides = [...items, ...items];
  const [idx, setIdx] = useState(0);
  const trackRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!autoPlay) return;
    const iv = setInterval(() => setIdx((i) => i + 1), 3000);
    return () => clearInterval(iv);
  }, [autoPlay]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const itemWidth = track.children[0]?.offsetWidth || 0;
    const w = itemWidth + 16;
    track.style.transition = "transform 0.5s ease";
    track.style.transform = `translateX(-${idx * w}px)`;
    if (idx >= count) {
      setTimeout(() => {
        track.style.transition = "none";
        track.style.transform = "translateX(0)";
        setIdx(0);
      }, 500);
    }
  }, [idx, count, items]);

  const prev = () => setIdx((i) => (i <= 0 ? count - visibleCount : i - 1));
  const next = () => setIdx((i) => (i >= count - visibleCount ? 0 : i + 1));

  return (
    <div className={`hc-container${!showControls ? " no-controls" : ""}`}>
      {showControls && (
        <button className="hc-btn left" onClick={prev}>
          &lt;
        </button>
      )}
      <div className="hc-viewport">
        <div className="hc-track" ref={trackRef}>
          {slides.map((it, i) => {
            const sale = Math.round((it.price * (100 - it.discountRate)) / 100);
            return (
              <div
                className="hc-card"
                key={`${it.id}-${i}`}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/selling/read/${it.id}`)}
              >
                <img
                  src={it.imageUrl}
                  alt={it.name}
                  className="hc-card-image"
                />
                <div className="hc-card-info">
                  <p className="hc-card-name">{it.name}</p>
                  {it.discountRate > 0 ? (
                    <>
                      <p className="hc-card-sale-price">
                        {sale.toLocaleString()}원
                      </p>
                      <p className="hc-card-original-price">
                        {it.price.toLocaleString()}원
                      </p>
                      <span className="hc-card-discount">
                        ~{it.discountRate}%
                      </span>
                    </>
                  ) : (
                    <p className="hc-card-price">
                      {it.price.toLocaleString()}원
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {showControls && (
        <button className="hc-btn right" onClick={next}>
          &gt;
        </button>
      )}
    </div>
  );
}

// --- GridPaginator 컴포넌트 ---
function GridPaginator({ items, perPage = 4 }) {
  const total = Math.ceil(items.length / perPage);
  const [page, setPage] = useState(0);
  const slice = items.slice(page * perPage, page * perPage + perPage);
  const navigate = useNavigate();

  return (
    <div className="grid-paginator">
      <button
        className="grid-btn left"
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        disabled={page === 0}
      >
        &lt;
      </button>
      <div className="grid-viewport">
        {slice.map((it) => {
          const sale = Math.round((it.price * (100 - it.discountRate)) / 100);
          return (
            <div
              className="hc-card"
              key={it.id}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/selling/read/${it.id}`)}
            >
              <img src={it.imageUrl} alt={it.name} className="hc-card-image" />
              <div className="hc-card-info">
                <p className="hc-card-name">{it.name}</p>
                {it.discountRate > 0 ? (
                  <>
                    <p className="hc-card-sale-price">
                      {sale.toLocaleString()}원
                    </p>
                    <p className="hc-card-original-price">
                      {it.price.toLocaleString()}원
                    </p>
                    <span className="hc-card-discount">
                      ~{it.discountRate}%
                    </span>
                  </>
                ) : (
                  <p className="hc-card-price">{it.price.toLocaleString()}원</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button
        className="grid-btn right"
        onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
        disabled={page === total - 1}
      >
        &gt;
      </button>
      <div className="paging">
        {page + 1} / {total}
      </div>
    </div>
  );
}

export default function MainPage() {
  const { exceptionHandle } = useCustomLogin();
  const [hotDeals, setHotDeals] = useState([]);
  const [sectionProducts, setSectionProducts] = useState({});
  const [loadingHot, setLoadingHot] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [visible, setVisible] = useState(SECTION_BATCH);
  const loadRef = useRef();

  const onIntersect = useCallback(
    ([entry]) => {
      if (entry.isIntersecting && visible < PRODUCT_SECTIONS.length) {
        setVisible((v) => v + SECTION_BATCH);
      }
    },
    [visible]
  );

  const fetchHotDeals = async () => {
    setLoadingHot(true);
    try {
      const { dtoList } = await getList({ page: 1, size: 100 });
      const deals = dtoList
        .filter((p) => p.discountRate > 0)
        .sort((a, b) => {
          const dr = b.discountRate - a.discountRate;
          if (dr !== 0) return dr;
          const pr = b.price - a.price;
          if (pr !== 0) return pr;
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
        .slice(0, HOT_DEAL_LIMIT)
        .map((p) => ({
          id: p.pno,
          name:
            p.brand && !p.pname.startsWith(p.brand)
              ? `${p.brand} ${p.pname}`
              : p.pname,
          price: p.price,
          discountRate: p.discountRate,
          imageUrl: p.uploadFileNames?.[0]
            ? `${API_SERVER_HOST}/api/products/view/s_${p.uploadFileNames[0]}`
            : "/fallback.png",
        }));
      setHotDeals(deals);
    } catch (err) {
      exceptionHandle(err);
    } finally {
      setLoadingHot(false);
    }
  };

  const fetchSectionProducts = async () => {
    setLoadingSections(true);
    try {
      const { dtoList } = await getList({ page: 1, size: 1000 });

      // 섹션별 상품 분류
      const sectionData = {};

      PRODUCT_SECTIONS.forEach((section) => {
        let products = [];

        switch (section.type) {
          case "best":
            // 주간 Best: 할인율 + 가격 + 최신순
            products = dtoList
              .sort((a, b) => {
                const discountDiff =
                  (b.discountRate || 0) - (a.discountRate || 0);
                if (discountDiff !== 0) return discountDiff;
                const priceDiff = b.price - a.price;
                if (priceDiff !== 0) return priceDiff;
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
              })
              .slice(0, 6);
            break;

          case "new":
            // 신상품: 최신 등록순
            products = dtoList
              .sort(
                (a, b) =>
                  new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
              )
              .slice(0, 6);
            break;

          case "recommended":
            // 추천 상품: 가격대비 할인율이 높은 상품
            products = dtoList
              .filter((p) => p.discountRate > 0)
              .sort((a, b) => {
                const aRatio = (a.discountRate || 0) / a.price;
                const bRatio = (b.discountRate || 0) / b.price;
                return bRatio - aRatio;
              })
              .slice(0, 6);
            break;

          case "local":
            // 로컬 인기: 하드코딩된 브랜드가 아닌 상품
            const hardcodedBrands = [
              "스타벅스",
              "컴포즈",
              "메가커피",
              "파리바게뜨",
              "뚜레쥬르",
              "던킨",
              "배스킨라빈스",
              "요거트아이스크림의정석",
              "도미노피자",
              "교촌치킨",
            ];
            products = dtoList
              .filter((p) => !hardcodedBrands.includes(p.brand))
              .sort(
                (a, b) =>
                  new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
              )
              .slice(0, 6);
            break;
        }

        // 상품 데이터 변환
        const formattedProducts = products.map((p) => ({
          id: p.pno,
          name:
            p.brand && !p.pname.startsWith(p.brand)
              ? `${p.brand} ${p.pname}`
              : p.pname,
          price: p.price,
          discountRate: p.discountRate || 0,
          imageUrl: p.uploadFileNames?.[0]
            ? `${API_SERVER_HOST}/api/products/view/s_${p.uploadFileNames[0]}`
            : "/fallback.png",
        }));

        if (formattedProducts.length > 0) {
          sectionData[section.name] = formattedProducts;
        }
      });

      setSectionProducts(sectionData);
    } catch (err) {
      exceptionHandle(err);
    } finally {
      setLoadingSections(false);
    }
  };

  useEffect(() => {
    fetchHotDeals();
    fetchSectionProducts();
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(onIntersect, { threshold: 1.0 });
    if (loadRef.current) obs.observe(loadRef.current);
    return () => obs.disconnect();
  }, [onIntersect]);

  return (
    <>
      <GraphComponent />
      <h2 className="section-title">🔥 Hot deal 🔥</h2>
      {loadingHot ? (
        <p>Loading...</p>
      ) : (
        <HorizontalCarousel
          items={hotDeals}
          visibleCount={4}
          autoPlay
          showControls={false}
        />
      )}

      {PRODUCT_SECTIONS.slice(0, visible).map((section) => {
        const products = sectionProducts[section.name] || [];
        if (products.length === 0) return null;

        return (
          <section key={section.name} className="category-section">
            <h3 className="category-title">
              {section.emoji} {section.name}
            </h3>
            <GridPaginator items={products} perPage={4} />
          </section>
        );
      })}

      <div ref={loadRef} style={{ height: 1 }} />
    </>
  );
}
