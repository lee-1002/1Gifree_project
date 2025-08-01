import React, { useRef, useState } from "react";
import { postAdd } from "../../api/productsApi";
import FetchingModal from "../common/FetchingModal";
import ResultModal from "../common/ResultModal";
import useCustomMove from "../../hooks/useCustomMove";
import "./AddComponent.css";

const initState = {
  pname: "",
  pdesc: "",
  price: 0,
  brand: "",
  discountRate: 0,
  salePrice: 0,
  files: [],
};

// 카테고리별 브랜드 매핑
const CATEGORY_BRANDS = {
  "커피/음료": ["스타벅스", "컴포즈", "메가커피"],
  "베이커리/도넛": ["파리바게뜨", "뚜레쥬르", "던킨"],
  아이스크림: ["배스킨라빈스", "요거트아이스크림의정석"],
  "피자/치킨": ["도미노피자", "교촌치킨"],
  로컬: ["강남구", "서초구", "마포구", "종로구"],
};

// 브랜드별 메뉴와 가격
const BRAND_MENUS = {
  스타벅스: [
    { pname: "아메리카노", price: 4500 },
    { pname: "카페라떼", price: 5000 },
    { pname: "카푸치노", price: 5000 },
    { pname: "카페모카", price: 5500 },
    { pname: "바닐라라떼", price: 5500 },
    { pname: "카라멜마끼아또", price: 5500 },
  ],
  컴포즈: [
    { pname: "아메리카노", price: 1500 },
    { pname: "카페라떼", price: 2000 },
    { pname: "카푸치노", price: 2000 },
    { pname: "카페모카", price: 2500 },
    { pname: "바닐라라떼", price: 2500 },
  ],
  메가커피: [
    { pname: "아메리카노", price: 1500 },
    { pname: "카페라떼", price: 2000 },
    { pname: "카푸치노", price: 2000 },
    { pname: "카페모카", price: 2500 },
    { pname: "바닐라라떼", price: 2500 },
  ],
  파리바게뜨: [
    { pname: "크로아상", price: 3500 },
    { pname: "베이글", price: 3000 },
    { pname: "식빵", price: 4000 },
    { pname: "단팥빵", price: 1500 },
    { pname: "크림빵", price: 2000 },
    { pname: "치아바타", price: 2500 },
  ],
  뚜레쥬르: [
    { pname: "크로아상", price: 3500 },
    { pname: "베이글", price: 3000 },
    { pname: "식빵", price: 4000 },
    { pname: "단팥빵", price: 1500 },
    { pname: "크림빵", price: 2000 },
    { pname: "치아바타", price: 2500 },
  ],
  던킨: [
    { pname: "글레이즈드 도넛", price: 1500 },
    { pname: "초코 도넛", price: 1500 },
    { pname: "딸기 도넛", price: 1500 },
    { pname: "바닐라 도넛", price: 1500 },
    { pname: "크림 도넛", price: 1800 },
  ],
  배스킨라빈스: [
    { pname: "아이스크림 1스쿱", price: 3500 },
    { pname: "아이스크림 2스쿱", price: 4500 },
    { pname: "아이스크림 3스쿱", price: 5500 },
    { pname: "아이스크림 콘", price: 4000 },
    { pname: "아이스크림 컵", price: 4500 },
  ],
  요거트아이스크림의정석: [
    { pname: "요거트아이스크림 1스쿱", price: 3000 },
    { pname: "요거트아이스크림 2스쿱", price: 4000 },
    { pname: "요거트아이스크림 3스쿱", price: 5000 },
    { pname: "요거트아이스크림 콘", price: 3500 },
    { pname: "요거트아이스크림 컵", price: 4000 },
  ],
  도미노피자: [
    { pname: "페퍼로니 피자 (M)", price: 18000 },
    { pname: "페퍼로니 피자 (L)", price: 22000 },
    { pname: "하와이안 피자 (M)", price: 18000 },
    { pname: "하와이안 피자 (L)", price: 22000 },
    { pname: "치즈 피자 (M)", price: 16000 },
    { pname: "치즈 피자 (L)", price: 20000 },
  ],
  교촌치킨: [
    { pname: "교촌 허니콤보", price: 18000 },
    { pname: "교촌 레드콤보", price: 18000 },
    { pname: "교촌 허니윙", price: 15000 },
    { pname: "교촌 레드윙", price: 15000 },
    { pname: "교촌 허니스틱", price: 12000 },
    { pname: "교촌 레드스틱", price: 12000 },
  ],
};

const CATEGORIES = Object.keys(CATEGORY_BRANDS);

const AddComponent = () => {
  const [product, setProduct] = useState({ ...initState });
  const [selectedCategory, setSelectedCategory] = useState("");
  const uploadRef = useRef();
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState(null);
  const { moveToList } = useCustomMove();
  const [modal, setModal] = useState({ open: false, msg: "" });

  const handleChangeProduct = (e) => {
    const { name, value } = e.target;

    // price, discountRate 입력 시 숫자만 허용
    if (name === "price" || name === "discountRate") {
      // 빈 문자열은 허용 (사용자가 지우는 중일 수 있어서)
      if (value !== "" && /[^0-9]/.test(value)) {
        setModal({ open: true, msg: "반드시 숫자를 입력해주십시오" });
        return; // 상태 업데이트도 막음
      }
      const num = parseInt(value || "0", 10);
      setProduct((prev) => {
        const updated = { ...prev, [name]: num };
        updated.salePrice = Math.round(
          (updated.price * (100 - updated.discountRate)) / 100
        );
        return updated;
      });
    } else {
      setProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setProduct((prev) => ({
      ...prev,
      brand: "",
      pname: "",
      price: 0,
      discountRate: 0,
      salePrice: 0,
    })); // 카테고리 변경 시 브랜드, 상품명, 가격, 할인율, 할인가 초기화
  };

  const handleBrandChange = (e) => {
    const brand = e.target.value;
    setProduct((prev) => ({
      ...prev,
      brand,
      pname: "",
      price: 0,
      discountRate: 0,
      salePrice: 0,
    })); // 브랜드 변경 시 상품명, 가격, 할인율, 할인가 초기화
  };

  const handleMenuChange = (e) => {
    const selectedMenu = e.target.value;
    if (selectedMenu && product.brand && BRAND_MENUS[product.brand]) {
      const menu = BRAND_MENUS[product.brand].find(
        (m) => m.pname === selectedMenu
      );
      if (menu) {
        setProduct((prev) => ({
          ...prev,
          pname: menu.pname,
          price: menu.price,
          discountRate: 0, // 메뉴 변경 시 할인율 초기화
          salePrice: menu.price, // 할인가를 원가로 초기화
        }));
      }
    }
  };

  const handleClickAdd = () => {
    // 최종 제출 전에도 한 번 더 검증
    if (
      !/^\d+$/.test(product.price.toString()) ||
      !/^\d+$/.test(product.discountRate.toString())
    ) {
      setModal({ open: true, msg: "반드시 숫자를 입력해주십시오" });
      return;
    }

    const files = uploadRef.current.files;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    formData.append("pname", product.pname);
    formData.append("pdesc", product.pdesc);
    formData.append("price", product.price.toString());
    formData.append("brand", product.brand);
    formData.append("discountRate", product.discountRate.toString());
    formData.append("salePrice", product.salePrice.toString());

    // FormData 디버깅용 출력
    for (let pair of formData.entries()) {
      console.log(pair[0] + ": " + pair[1]);
    }

    setFetching(true);
    postAdd(formData).then((data) => {
      setFetching(false);
      setResult(data.result);
    });
  };

  const closeModal = () => {
    setResult(null);
    moveToList("/selling", { page: 1 });
  };

  return (
    <div className="add-component">
      {fetching && <FetchingModal className="modal-overlay" />}
      {result && (
        <ResultModal
          title="Product Add Result"
          content={`${result}번 등록 완료`}
          callbackFn={closeModal}
        />
      )}
      {modal.open && (
        <ResultModal
          title="알림"
          content={modal.msg}
          callbackFn={() => setModal({ open: false, msg: "" })}
        />
      )}

      {/* Category */}
      <div className="form-group">
        <div className="form-label">카테고리</div>
        <div className="form-input">
          <select
            name="category"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value="">카테고리를 선택하세요</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Brand */}
      <div className="form-group">
        <div className="form-label">브랜드</div>
        <div className="form-input">
          {selectedCategory === "로컬" ? (
            <input
              name="brand"
              type="text"
              value={product.brand}
              onChange={handleBrandChange}
              placeholder="브랜드를 입력하세요"
            />
          ) : (
            <select
              name="brand"
              value={product.brand}
              onChange={handleBrandChange}
              disabled={!selectedCategory}
            >
              <option value="">브랜드를 선택하세요</option>
              {selectedCategory &&
                CATEGORY_BRANDS[selectedCategory]?.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* Product Name */}
      <div className="form-group">
        <div className="form-label">상품명</div>
        <div className="form-input">
          {selectedCategory === "로컬" ? (
            <input
              name="pname"
              type="text"
              value={product.pname}
              onChange={handleChangeProduct}
              placeholder="상품명을 입력하세요"
            />
          ) : (
            <select
              name="pname"
              value={product.pname}
              onChange={handleMenuChange}
              disabled={!product.brand}
            >
              <option value="">상품을 선택하세요</option>
              {product.brand &&
                BRAND_MENUS[product.brand]?.map((menu) => (
                  <option key={menu.pname} value={menu.pname}>
                    {menu.pname}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="form-group">
        <div className="form-label">가격</div>
        <div className="form-input">
          <input
            name="price"
            type="text" // 문자 제한을 위해 number -> text로 변경해도 좋습니다
            value={product.price === 0 ? "" : product.price}
            onChange={handleChangeProduct}
          />
        </div>
      </div>

      {/* Discount Rate (%) */}
      <div className="form-group">
        <div className="form-label">할인율 (%)</div>
        <div className="form-input">
          <input
            name="discountRate"
            type="text" // 동일
            value={product.discountRate === 0 ? "" : product.discountRate}
            onChange={handleChangeProduct}
          />
        </div>
      </div>

      {/* Sale Price (읽기 전용) */}
      <div className="form-group">
        <div className="form-label">할인가</div>
        <div className="form-input">
          <input
            className="readonly-input"
            type="text"
            readOnly
            value={`${product.salePrice.toLocaleString()} 원`}
          />
        </div>
      </div>

      {/* Files */}
      <div className="form-group">
        <div className="form-label">이미지</div>
        <div className="form-input">
          <input ref={uploadRef} type="file" multiple />
        </div>
      </div>

      {/* ADD 버튼 */}
      <div className="button-group">
        <button type="button" onClick={handleClickAdd}>
          등록하기
        </button>
      </div>
    </div>
  );
};

export default AddComponent;
