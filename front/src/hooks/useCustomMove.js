import { useNavigate } from "react-router-dom";
import { useState } from "react";

const useCustomMove = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [refresh, setRefresh] = useState(false); // 새로고침 트리거

  // Read 페이지 이동 함수
  const moveToRead = (num, basePath) => {
    // basePath 인자 추가
    if (!basePath) {
      console.error("moveToRead: basePath가 제공되지 않았습니다.");
      return; // basePath가 없으면 이동하지 않음
    }
    // `basePath`를 사용하여 동적으로 경로를 구성
    navigate(`${basePath}/read/${num}?page=${page}&size=${size}`);
  };

  // List 페이지 이동 함수
  const moveToList = (basePath, params, useListSuffix = true) => {
    // basePath 인자 추가
    if (!basePath) {
      console.error("moveToList: basePath가 제공되지 않았습니다.");
      return;
    }
    const currentPage = params?.page || 1;
    const currentSize = params?.size || size; // 현재 size 상태 사용
    setPage(currentPage); // 페이지 상태 업데이트
    setSize(currentSize); // 사이즈 상태 업데이트

    const targetPath = `${basePath}?page=${currentPage}&size=${currentSize}`;

    navigate(targetPath);
  };

  const moveToModify = (num, basePath) => {
    if (!basePath) {
      console.error("moveToModify: basePath가 제공되지 않았습니다.");
      return;
    }
    // modify 경로로 이동하며, 게시글 번호(num)를 포함
    navigate(`${basePath}/modify/${num}?page=${page}&size=${size}`);
  };

  return {
    page,
    size,
    refresh,
    setRefresh,
    moveToRead,
    moveToList,
    moveToModify,
  };
};

export default useCustomMove;
