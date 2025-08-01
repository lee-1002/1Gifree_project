import { API_SERVER_HOST } from "../../api/backendApi";
const host = API_SERVER_HOST;

const CartItemComponent = ({
  cino,
  pname,
  price,
  salePrice,
  pno,
  qty,
  imageFile,
  changeCart,
  memberid,
  checked,
  onToggle,
}) => {
  const handleClickQty = (amount) => {
    changeCart({ memberid, cino, pno, qty: qty + amount });
    // 장바구니 개수 업데이트 이벤트 발생
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <li className="flex gap-4 border rounded-md p-4 bg-white shadow-sm items-start">
      {/* 체크박스 */}
      <div className="mt-2">
        <input type="checkbox" checked={checked} onChange={onToggle} />
      </div>

      {/* 상품 이미지 */}
      <div className="w-36 h-36 flex-shrink-0 rounded overflow-hidden border p-1 mr-4 flex items-center justify-center">
        {imageFile ? (
          <img
            src={`${host}/api/products/view/${imageFile}`}
            alt={pname}
            className="block max-w-full max-h-full object-contain"
            onError={(e) => {
              e.target.src =
                "https://img.sa.nexon.com/S2/Game/sudden/2011/temp/thumb_event_noImage.jpg";
            }}
          />
        ) : (
          <img
            src="https://img.sa.nexon.com/S2/Game/sudden/2011/temp/thumb_event_noImage.jpg"
            alt="이미지 없음"
            className="block max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* 상품 상세 정보 */}
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-start">
          <div className="text-gray-800 font-semibold text-base">{pname}</div>
          <button
            onClick={() => handleClickQty(-1 * qty)}
            className="text-sm text-gray-500 hover:text-red-500"
          >
            삭제
          </button>
        </div>

        <div className="mt-2 text-lg font-bold text-gray-900">
          {(salePrice || price).toLocaleString()}원
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => handleClickQty(-1)}
            className="border px-2 py-1 rounded text-sm hover:bg-gray-100"
          >
            -
          </button>
          <span className="font-medium text-base">{qty}</span>
          <button
            onClick={() => handleClickQty(1)}
            className="border px-2 py-1 rounded text-sm hover:bg-gray-100"
          >
            +
          </button>
        </div>

        <div className="mt-3 text-right font-bold text-blue-700">
          {(qty * (salePrice || price)).toLocaleString()} 원
        </div>
      </div>
    </li>
  );
};

export default CartItemComponent;
