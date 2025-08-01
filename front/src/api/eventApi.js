import axios from "axios";
import { API_SERVER_HOST } from "./backendApi"; // 예: http://localhost:8080
import jwtAxios from "../util/jwtUtil";

const host = `${API_SERVER_HOST}/api/events`;

// 이벤트 목록 조회
export const getEvents = async (page = 1, size = 4) => {
  const res = await axios.get(`${host}?page=${page}&size=${size}`);
  return res.data;
};

// 단일 이벤트 조회
export const getEventById = async (id) => {
  const res = await axios.get(`${host}/${id}`);
  return res.data;
};

// 이벤트 등록
export const addEvent = async (formData) => {
  try {
    const res = await jwtAxios.post(host, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ 서버 응답:", res.data);
    return res.data;
  } catch (error) {
    console.error(
      "❌ 이벤트 등록 실패:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// 이벤트 수정
export const modifyEvent = async (id, formData) => {
  try {
    const res = await jwtAxios.put(`${host}/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ 이벤트 수정 서버 응답:", res.data);
    return res.data;
  } catch (error) {
    console.error(
      "❌ 이벤트 수정 실패:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// 이벤트 삭제
export const deleteEventById = async (id) => {
  const res = await jwtAxios.delete(`${host}/${id}`);
  return res.data;
};

// 이벤트 활성화/비활성화 토글
export const patchToggleEventStatus = async (id) => {
  const res = await jwtAxios.patch(`${host}/${id}/toggle`);
  return res.data;
};

// 이미지 파일 업로드 API
export const uploadEventImage = async (file) => {
  const formData = new FormData();
  formData.append("image_file", file);

  const res = await jwtAxios.post(`${host}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data; // { image_url: "https://..." }
};


export const editEventById = async (id, formData) => {
  const res = await jwtAxios.put(`${host}/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
