import jwtAxios from "../util/jwtUtil";
import { API_SERVER_HOST } from "./backendApi";

//locolhost:8080/api/cart
const host = `${API_SERVER_HOST}/api/cart`;

// 카트에 있는 제품 목록을 백엔드 조회
export const getCartItems = async () => {
  const res = await jwtAxios.get(`${host}/items`);

  return res.data;
};

// 장바구니 개수 조회
export const getCartCount = async () => {
  const res = await jwtAxios.get(`${host}/count`);
  return res.data.count;
};

// 카트에 있는 제품을 수정
export const postChangeCart = async (cartItem) => {
  const res = await jwtAxios.post(`${host}/change`, cartItem);

  return res.data;
};

// 장바구니에서 상품 삭제 (cino로)
export const deleteCartItem = async (cino) => {
  const res = await jwtAxios.delete(`${host}/${cino}`);
  return res.data;
};
