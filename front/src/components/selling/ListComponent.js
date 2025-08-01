// src/components/ListComponent.js

import { useEffect, useState, useRef } from "react";
import { getList } from "../../api/productsApi";
import useCustomMove from "../../hooks/useCustomMove";
import FetchingModal from "../common/FetchingModal";
import { API_SERVER_HOST } from "../../api/backendApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import { Link } from "react-router-dom";
import "./ListComponent.css";
import useCustomUserRoles from "../../hooks/useCustomUserRoles";
import useCustomCart from "../../hooks/useCustomCart";
import ResultModal from "../common/ResultModal";

const host = API_SERVER_HOST;

const SORT_OPTIONS = [
  { key: "low", label: "낮은 가격순" },
  { key: "high", label: "높은 가격순" },
];

const BRAND_CATEGORIES = [
  { label: "커피/음료", items: ["스타벅스", "컴포즈", "메가커피"] },
  { label: "베이커리/도넛", items: ["파리바게뜨", "뚜레쥬르", "던킨"] },
  { label: "아이스크림", items: ["배스킨라빈스", "요거트아이스크림의정석"] },
  { label: "피자/치킨", items: ["도미노피자", "교촌치킨"] },
  { label: "로컬", items: [] },
];

const ListComponent = () => {
  const { moveToRead } = useCustomMove();
  const { exceptionHandle, loginState } = useCustomLogin();
  const { changeCart, cartItems } = useCustomCart();

  const [dtoList, setDtoList] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [brandFilter, setBrandFilter] = useState(null);
  const [sortKey, setSortKey] = useState("");

  const [page, setPage] = useState(1);
  const size = 20; // 한 번에 20개씩
  const { isAdmin } = useCustomUserRoles();

  const [modal, setModal] = useState({ open: false, msg: "" });
  const [confirm, setConfirm] = useState({
    open: false,
    msg: "",
    onConfirm: null,
  });

  const sentinelRef = useRef(null);

  // 1) 페이지 변화 시 데이터 페칭
  useEffect(() => {
    setFetching(true);
    getList({ page, size })
      .then((data) => {
        console.log("🔥 getList 응답 전체 데이터:", data);

        // 여기서 리스트를 추출
        const list = data?.dtoList || [];

        console.log("📦 추출된 리스트:", list);
        if (list.length < size) {
          setHasMore(false);
        }
        setDtoList((prev) => [...prev, ...list]);
      })
      .catch((err) => exceptionHandle(err))
      .finally(() => setFetching(false));
  }, [page]);

  // 2) IntersectionObserver 로 무한스크롤 트리거
  useEffect(() => {
    if (!hasMore || fetching) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, fetching]);

  // 3) 필터 & 정렬
  const sortFns = {
    "": (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    low: (a, b) => {
      const aSalePrice = a.salePrice || a.price;
      const bSalePrice = b.salePrice || b.price;
      return aSalePrice - bSalePrice;
    },
    high: (a, b) => {
      const aSalePrice = a.salePrice || a.price;
      const bSalePrice = b.salePrice || b.price;
      return bSalePrice - aSalePrice;
    },
  };

  const filteredAndSorted = dtoList
    .filter((p) => {
      if (!brandFilter) return true;

      // 로컬 카테고리 클릭 시: BRAND_CATEGORIES의 하위 카테고리에 없는 브랜드들을 로컬로 간주
      if (brandFilter === "로컬") {
        const allBrandItems = BRAND_CATEGORIES.flatMap((cat) => cat.items);
        return !allBrandItems.includes(p.brand);
      }

      // 상위 카테고리 클릭 시: 해당 카테고리의 모든 브랜드 상품 표시
      const selectedCategory = BRAND_CATEGORIES.find(
        (cat) => cat.label === brandFilter
      );
      if (selectedCategory) {
        return selectedCategory.items.includes(p.brand);
      }

      // 하위 브랜드 클릭 시: 해당 브랜드만 표시
      return p.brand === brandFilter || p.pname.includes(brandFilter);
    })
    .sort(sortFns[sortKey]);

  const handleClickAddCart = (product, e) => {
    e.stopPropagation(); // 상품 카드 클릭 이벤트 방지

    if (!loginState.email) {
      setModal({ open: true, msg: "로그인이 필요합니다." });
      return;
    }

    let qty = 1;
    const addedItem = cartItems.find((item) => item.pno === product.pno);

    if (addedItem) {
      setConfirm({
        open: true,
        msg: "이미 추가된 상품입니다. 추가하시겠습니까?",
        onConfirm: () => {
          qty = addedItem.qty + 1;
          changeCart({ email: loginState.email, pno: product.pno, qty });
          setModal({ open: true, msg: "장바구니에 추가되었습니다." });
        },
      });
      return;
    }

    setConfirm({
      open: true,
      msg: "장바구니에 담겠습니까?",
      onConfirm: () => {
        changeCart({ email: loginState.email, pno: product.pno, qty });
        setModal({ open: true, msg: "장바구니에 추가되었습니다." });
      },
    });
  };

  return (
    <>
      {modal.open && (
        <ResultModal
          title="알림"
          content={modal.msg}
          callbackFn={() => setModal({ open: false, msg: "" })}
        />
      )}
      {confirm.open && (
        <div className="confirm-modal">
          <div className="confirm-content">
            <div className="confirm-message">{confirm.msg}</div>
            <div className="confirm-buttons">
              <button
                className="confirm-button confirm-yes"
                onClick={() => {
                  confirm.onConfirm && confirm.onConfirm();
                  setConfirm({ ...confirm, open: false });
                }}
              >
                확인
              </button>
              <button
                className="confirm-button confirm-no"
                onClick={() => setConfirm({ ...confirm, open: false })}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="add-button-container">
        {isAdmin && (
          <Link to="/selling/add" className="add-button">
            추가
          </Link>
        )}
      </div>

      <div className="selling-page">
        {fetching && <FetchingModal />}

        {/* 카테고리 메뉴 */}
        <div
          className="category-menu"
          style={{
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
          }}
        >
          {BRAND_CATEGORIES.map((cat) => {
            // 현재 선택된 브랜드가 이 카테고리에 속하는지 확인
            const isCategoryActive =
              brandFilter === cat.label || cat.items.includes(brandFilter);

            return (
              <div key={cat.label} className="category-column">
                <h4
                  className={isCategoryActive ? "active" : ""}
                  onClick={() =>
                    setBrandFilter((cur) =>
                      cur === cat.label ? null : cat.label
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  {cat.label}
                </h4>
                {cat.items.length > 0 && (
                  <ul>
                    {cat.items.map((name) => (
                      <li
                        key={name}
                        className={brandFilter === name ? "active" : ""}
                        onClick={() =>
                          setBrandFilter((cur) => (cur === name ? null : name))
                        }
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* 정렬 메뉴 */}
        <ul
          className="sort-menu"
          style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
        >
          {SORT_OPTIONS.map((opt) => (
            <li
              key={opt.key}
              className={opt.key === sortKey ? "active" : ""}
              onClick={() => setSortKey(opt.key)}
            >
              {opt.label}
            </li>
          ))}
        </ul>

        {/* 상품 리스트 */}
        <ul className="product-list">
          {filteredAndSorted.map((product) => {
            const hasDiscount =
              product.salePrice != null &&
              product.discountRate != null &&
              product.discountRate > 0;

            return (
              <li
  key={product.pno}
  className="product-card"
  onClick={() => moveToRead(product.pno, "/selling")}
  style={{ cursor: "pointer" }}
>
  <div className="product-link">
    {product.uploadFileNames?.length > 0 && (
      <img
        alt="product"
        className="product-image"
        src={`${host}/api/products/view/s_${product.uploadFileNames[0]}`}
      />
    )}
    <p className="brand">{product.brand}</p>
    <p className="title">{product.pname}</p>

    {hasDiscount ? (
      <p className="price">
        <span className="discount">~{product.discountRate}%</span>
        <span className="sale-price">
          {product.salePrice.toLocaleString()}원
        </span>
        <span className="original-price">
          <s>{product.price.toLocaleString()}원</s>
        </span>
      </p>
    ) : (
      <p className="price">
        {product.price?.toLocaleString() ?? "가격 정보 없음"}원
      </p>
    )}
  </div>
</li>
            );
          })}
        </ul>

        {/* sentinel: 뷰포트 근처에 들어올 때만 다음 페이지 로드 */}
        <div ref={sentinelRef} />

        {/* 로딩/끝 메시지 */}
        {!fetching && filteredAndSorted.length === 0 && (
          <div className="no-items">선택한 브랜드의 상품이 없습니다.</div>
        )}
      </div>
    </>
  );
};

export default ListComponent;
