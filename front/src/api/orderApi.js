import axios from "axios";
import { API_SERVER_HOST } from "./backendApi";
import { getCookie } from "../util/cookieUtil";
import jwtAxios from "../util/jwtUtil";

// 주문 생성
export const createOrder = (req) => {
  const memberInfo = getCookie("member");
  const token = memberInfo?.accessToken;
  if (!token) {
    return Promise.reject(new Error("로그인이 필요합니다."));
  }
  return axios.post(`${API_SERVER_HOST}/api/order`, req, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
};

// 주문 내역 조회
export const getOrderHistory = () => {
  const memberInfo = getCookie("member");
  const token = memberInfo?.accessToken;
  if (!token) {
    return Promise.reject(new Error("로그인이 필요합니다."));
  }
  return axios.get(`${API_SERVER_HOST}/api/order/history`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
};

// 보관함에 상품 추가
export const addToCollection = (productData) => {
  const memberInfo = getCookie("member");
  const token = memberInfo?.accessToken;
  if (!token) {
    return Promise.reject(new Error("로그인이 필요합니다."));
  }
  return axios.post(`${API_SERVER_HOST}/api/collection/add`, productData, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
};

// 보관함 조회
export const getCollection = () => {
  const memberInfo = getCookie("member");
  const token = memberInfo?.accessToken;
  if (!token) {
    return Promise.reject(new Error("로그인이 필요합니다."));
  }
  return axios.get(`${API_SERVER_HOST}/api/collection`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
};

// 보관함에서 상품 삭제
export const removeFromCollection = (pno) => {
  const memberInfo = getCookie("member");
  const token = memberInfo?.accessToken;
  if (!token) {
    return Promise.reject(new Error("로그인이 필요합니다."));
  }
  return axios.delete(`${API_SERVER_HOST}/api/collection/${pno}`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
};

// 보관함 개수 조회
export const getCollectionCount = () => {
  const memberInfo = getCookie("member");
  const token = memberInfo?.accessToken;
  if (!token) {
    return Promise.reject(new Error("로그인이 필요합니다."));
  }
  return axios.get(`${API_SERVER_HOST}/api/collection/count`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
};

// 랜덤박스 기회 조회
export const getRandomBoxChances = () => {
  const memberInfo = getCookie("member");
  if (!memberInfo || !memberInfo.accessToken) {
    return Promise.reject({ response: { data: { error: "REQUIRE_LOGIN" } } });
  }
  return jwtAxios.get(`${API_SERVER_HOST}/api/randombox/chances`);
};

// 랜덤박스 기회 사용
export const consumeRandomBoxChance = () => {
  const memberInfo = getCookie("member");
  if (!memberInfo || !memberInfo.accessToken) {
    return Promise.reject({ response: { data: { error: "REQUIRE_LOGIN" } } });
  }
  return jwtAxios.post(`${API_SERVER_HOST}/api/randombox/use`);
};
