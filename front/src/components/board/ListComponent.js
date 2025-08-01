// src/components/board/ListComponent.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchBoards,
  fetchBoardsWithMembers,
  postAddBoard,
} from "../../api/boardsApi";
import { getMemberInfo } from "../../api/memberApi";
import FetchingModal from "../common/FetchingModal";
import ResultModal from "../common/ResultModal";
import "./ListComponent.css";

export default function ListComponent() {
  const navigate = useNavigate();
  const uploadRef = useRef();

  // 게시글 데이터 + 로딩/결과 상태
  const [posts, setPosts] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState(null);
  const [modal, setModal] = useState({ open: false, msg: "" });

  // 페이지네이션
  const POSTS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // 새 글 폼
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 검색 기능
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchType, setSearchType] = useState("전체");
  const [filteredPosts, setFilteredPosts] = useState([]);

  // member 정보 캐시
  const [memberCache, setMemberCache] = useState({});

  // 초기 데이터 로드
  useEffect(() => {
    loadPosts();
  }, []);

  // --- 변경된 loadPosts: bno 기준 내림차순 정렬 추가 ---
  const loadPosts = async () => {
    try {
      const data = await fetchBoardsWithMembers();
      console.log("게시글 데이터 (with members):", data); // 데이터 구조 확인

      // 날짜 기준 내림차순 정렬 (최신순)
      const sorted = data.sort((a, b) => {
        const getDate = (post) => {
          const dateField = post.regDate || post.createdAt || post.createDate || post.date;
          if (!dateField) return new Date(0);
          
          if (typeof dateField === "string") {
            return new Date(dateField);
          }
          
          if (dateField instanceof Date) {
            return dateField;
          }
          
          return new Date(0);
        };
        
        const dateA = getDate(a);
        const dateB = getDate(b);
        
        return dateB - dateA; // 최신순 (내림차순)
      });
      setPosts(sorted);
      setFilteredPosts(sorted); // 초기에는 모든 게시글 표시

      // (옵션) 페이지를 1로 리셋하고 싶다면:
      // setCurrentPage(1);
    } catch (error) {
      console.error("게시글 로드 실패:", error);
      // fallback: 기존 API 사용
      try {
        const fallbackData = await fetchBoards();
        const sorted = fallbackData.sort((a, b) => {
          const getDate = (post) => {
            const dateField = post.regDate || post.createdAt || post.createDate || post.date;
            if (!dateField) return new Date(0);
            
            if (typeof dateField === "string") {
              return new Date(dateField);
            }
            
            if (dateField instanceof Date) {
              return dateField;
            }
            
            return new Date(0);
          };
          
          const dateA = getDate(a);
          const dateB = getDate(b);
          
          return dateB - dateA; // 최신순 (내림차순)
        });
        setPosts(sorted);
        setFilteredPosts(sorted);
        await loadMemberInfo(sorted);
      } catch (fallbackError) {
        console.error("Fallback 로드도 실패:", fallbackError);
        setModal({ open: true, msg: "게시글을 불러오는데 실패했습니다." });
      }
    }
  };

  // member 정보 로드
  const loadMemberInfo = async (posts) => {
    console.log(
      "게시글 writer 필드들:",
      posts.map((post) => ({
        bno: post.bno,
        writer: post.writer,
        email: post.email,
      }))
    );

    const uniqueWriters = [
      ...new Set(
        posts.map((post) => post.writer || post.email).filter(Boolean)
      ),
    ];
    console.log("고유한 writer들:", uniqueWriters);

    const newCache = { ...memberCache };

    for (const writer of uniqueWriters) {
      if (!memberCache[writer]) {
        try {
          const memberInfo = await getMemberInfo(writer);
          newCache[writer] = memberInfo.nickname || writer;
          console.log(`Member info loaded for ${writer}:`, memberInfo.nickname);
        } catch (error) {
          console.error(`Member info load failed for ${writer}:`, error);
          newCache[writer] = writer; // 실패 시 writer 그대로 사용
        }
      }
    }

    setMemberCache(newCache);
  };
  // ------------------------------------------------------

  // 검색 기능
  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      setFilteredPosts(posts);
      setCurrentPage(1);
      return;
    }

    const filtered = posts.filter((post) => {
      const keyword = searchKeyword.toLowerCase();

      switch (searchType) {
        case "제목":
          return post.title.toLowerCase().includes(keyword);
        case "내용":
          return post.content.toLowerCase().includes(keyword);
        case "제목+내용":
          return (
            post.title.toLowerCase().includes(keyword) ||
            post.content.toLowerCase().includes(keyword)
          );
        case "글쓴이":
          const writerKey1 = post.writer || post.email;
          return (
            (writerKey1 && writerKey1.toLowerCase().includes(keyword)) ||
            (memberCache[writerKey1] &&
              memberCache[writerKey1].toLowerCase().includes(keyword))
          );
        default: // 전체
          const writerKey2 = post.writer || post.email;
          return (
            post.title.toLowerCase().includes(keyword) ||
            post.content.toLowerCase().includes(keyword) ||
            (writerKey2 && writerKey2.toLowerCase().includes(keyword)) ||
            (memberCache[writerKey2] &&
              memberCache[writerKey2].toLowerCase().includes(keyword))
          );
      }
    });

    setFilteredPosts(filtered);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    setSearchKeyword("");
    setSearchType("전체");
    setFilteredPosts(posts);
    setCurrentPage(1);
  };

  // 글 등록
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setModal({ open: true, msg: "제목과 내용을 입력해주세요." });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("writer", "user1");

    setFetching(true);
    try {
      const { result: bno } = await postAddBoard(formData);
      setResult(bno);
      await loadPosts(); // 등록 후에도 내림차순 유지
    } catch (err) {
      console.error(err);
      setModal({ open: true, msg: "등록 실패했습니다." });
    } finally {
      setFetching(false);
      setShowForm(false);
      setTitle("");
      setContent("");
    }
  };

  // 중복 제거된 게시글 목록
  const getUniquePosts = (posts) => {
    const processedPosts = [];
    const seenTitles = new Set();
    const seenAuthors = new Set();
    
    posts.forEach((p) => {
      const title = p.title || "";
      const author = p.memberNickname || p.nickname || p.writer || p.email || "익명";
      
      // 제목과 글쓴이 모두 중복되지 않은 경우만 추가
      if (!seenTitles.has(title) && !seenAuthors.has(author)) {
        seenTitles.add(title);
        seenAuthors.add(author);
        processedPosts.push(p);
      }
    });
    
    return processedPosts;
  };

  // 중복 제거된 게시글 목록
  const uniquePosts = getUniquePosts(filteredPosts);

  // 현재 페이지에 보여줄 게시글
  const indexOfLast = currentPage * POSTS_PER_PAGE;
  const indexOfFirst = indexOfLast - POSTS_PER_PAGE;
  const currentPosts = uniquePosts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(uniquePosts.length / POSTS_PER_PAGE);

  return (
    <div className="Board-main">
      {fetching && <FetchingModal />}

      {result && (
        <ResultModal
          title="등록 완료"
          content={`${result}번 게시글이 등록되었습니다.`}
          callbackFn={() => setResult(null)}
        />
      )}

      {modal.open && (
        <ResultModal
          title="알림"
          content={modal.msg}
          callbackFn={() => setModal({ open: false, msg: "" })}
        />
      )}

      {/* 검색바 */}
      <div className="search-bar">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option value="전체">전체</option>
          <option value="제목">제목</option>
          <option value="내용">내용</option>
          <option value="제목+내용">제목+내용</option>
          <option value="글쓴이">글쓴이</option>
        </select>
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch}>검색</button>
        {searchKeyword && (
          <button
            onClick={handleClearSearch}
            style={{ backgroundColor: "#6b7280" }}
          >
            초기화
          </button>
        )}
        <div className="add-post-button" onClick={() => setShowForm(true)}>
          <span className="add-post-text">글쓰기</span>
        </div>
      </div>

      {/* 카테고리 + 테이블 */}
      <div className="Board-content-area">
        <div className="category-container">
          <ul className="category-list">
            <li>
              <button className="category-btn active">전체</button>
            </li>
          </ul>
        </div>
        <div className="board-table-container">
          <table className="board-table">
            <thead>
              <tr>
                <th className="id">번호</th>
                <th className="title">제목</th>
                <th className="author">글쓴이</th>
                <th className="date">등록일</th>
                <th className="views">조회수</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#6b7280",
                    }}
                  >
                    {searchKeyword
                      ? `"${searchKeyword}"에 대한 검색 결과가 없습니다.`
                      : "게시글이 없습니다."}
                  </td>
                </tr>
              ) : (
                currentPosts.map((p) => {
                    // 등록일 처리 - 다양한 필드명과 형식 지원
                    const getRegDate = (post) => {
                      const dateField =
                        post.regDate ||
                        post.createdAt ||
                        post.createDate ||
                        post.date;
                      if (!dateField) return "";

                      // 문자열인 경우 날짜 형식으로 변환
                      if (typeof dateField === "string") {
                        return dateField.slice(0, 10);
                      }

                      // Date 객체인 경우
                      if (dateField instanceof Date) {
                        return dateField.toISOString().slice(0, 10);
                      }

                      return "";
                    };

                    // 조회수 처리 - 다양한 필드명 지원
                    const getViews = (post) => {
                      return (
                        post.views ||
                        post.viewCount ||
                        post.hit ||
                        post.hitCount ||
                        0
                      );
                    };

                    return (
                      <tr key={p.bno}>
                        <td className="id">{p.bno}</td>
                        <td
                          className="title"
                          onClick={() => navigate(`/board/read/${p.bno}`)}
                        >
                          {p.title}
                        </td>
                        <td className="author">
                          {p.memberNickname ||
                            p.nickname ||
                            p.writer ||
                            p.email ||
                            "익명"}
                        </td>
                        <td className="date">{getRegDate(p)}</td>
                        <td className="views">{getViews(p)}</td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      <nav className="pagination-nav">
        <ul className="pagination-list">
          <li
            className="pagination-item prev"
            onClick={() =>
              currentPage > 1 && setCurrentPage((prev) => prev - 1)
            }
          >
            &lt;
          </li>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <li
              key={num}
              className={`pagination-item ${
                currentPage === num ? "active" : ""
              }`}
              onClick={() => setCurrentPage(num)}
            >
              {num}
            </li>
          ))}
          <li
            className="pagination-item next"
            onClick={() =>
              currentPage < totalPages && setCurrentPage((prev) => prev + 1)
            }
          >
            &gt;
          </li>
        </ul>
      </nav>

      {/* 글쓰기 모달 */}
      {showForm && (
        <div className="Form-overlay">
          <form className="Write-form" onSubmit={handleSubmit}>
            <h2>새 글 작성</h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
            />

            <div className="Write-buttons">
              <button type="submit">등록</button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                }}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
