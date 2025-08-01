import { API_SERVER_HOST } from "./backendApi";
import jwtAxios from "../util/jwtUtil";
import axios from "axios";

const prefix = `${API_SERVER_HOST}/api/donationBoard`;
//권한이 필요 없을 경우 axios로.

export const getOne = async (tno) => {
  const res = await axios.get(`${prefix}/${tno}`);
  return res.data;
};

export const getList = async (pageParam) => {
  const { page, size } = pageParam;
  const res = await axios.get(`${prefix}/list`, {
    params: { page: page, size: size },
  });
  return res.data;
};

export const postAdd = async (DonationBoardObj) => {
  const res = await jwtAxios.post(`${prefix}/`, DonationBoardObj, {});
  return res.data;
};

export const deleteOne = async (tno) => {
  const res = await jwtAxios.delete(`${prefix}/${tno}`);
  return res.data;
};

export const putOne = async (donationBoard) => {
  console.log("🔍 putOne API 호출 시작");
  console.log("URL:", `${prefix}/${donationBoard.tno}`);
  console.log("데이터:", donationBoard);

  try {
    // 임시로 일반 axios 사용 (토큰 갱신 문제 해결을 위해)
    const res = await axios.put(
      `${prefix}/${donationBoard.tno}`,
      donationBoard,
      {}
    );
    console.log("✅ putOne API 성공:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ putOne API 실패:", error);
    throw error;
  }
};

export const addImageFilesForBoard = async (tno, fileNames) => {
  const res = await jwtAxios.post(`${prefix}/${tno}/files`, fileNames);
  return res.data;
};
export const getRecentList = async () => {
  try {
    const res = await axios.get(`${prefix}/list`, {
      params: { page: 1, size: 10 }, // 첫 페이지 10개만 요청
    });
    return res.data.dtoList || [];
  } catch (error) {
    console.error("최신 게시글 목록을 가져오는 중 오류 발생:", error);
    return [];
  }
};
