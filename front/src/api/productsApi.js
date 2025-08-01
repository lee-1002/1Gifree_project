import axios from "axios";
import { API_SERVER_HOST } from "./backendApi";
import jwtAxios from "../util/jwtUtil";
// localhost:8080/api/products
const host = `${API_SERVER_HOST}/api/products`;

export const postAdd = async (product) => {
  // file 타입은 "multipart/form-data"
  const header = { headers: { "Content-Type": "multipart/form-data" } };

  // 경로 뒤 '/' 주의
  const res = await jwtAxios.post(`${host}`, product, header);

  return res.data;
};
export const getList = async (pageParam) => {
  const { page, size, keyword } = pageParam;

  const res = await axios.get(`${host}/list`, {
    params: { page: page, size: size, keyword: keyword },
  });

  return res.data;
};

// 조회
export const getOne = async (pno) => {
  const res = await jwtAxios.get(`${host}/${pno}`);

  return res.data;
};

export const putOne = async (pno, product) => {
  const header = { headers: { "Content-Type": "multipart/form-data" } };

  const res = await jwtAxios.put(`${host}/${pno}`, product, header);

  return res.data;
};

export const deleteOne = async (pno) => {
  const res = await jwtAxios.delete(`${host}/${pno}`);

  return res.data;
};
