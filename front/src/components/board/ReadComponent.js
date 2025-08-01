import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchBoard,
  postModifyBoard,
  incrementViews,
  deleteBoard,
} from "../../api/boardsApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import useCustomUserRoles from "../../hooks/useCustomUserRoles";
import "./ReadComponent.css";

export default function ReadComponent() {
  const { bno } = useParams();
  const nav = useNavigate();
  const { loginState } = useCustomLogin();
  const { isAdmin } = useCustomUserRoles();
  const [post, setPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    const loadBoard = async () => {
      try {
        const data = await fetchBoard(bno);
        setPost(data);
        setEditForm({
          title: data.title,
          content: data.content,
        });

        // 조회수 증가
        try {
          await incrementViews(bno);
        } catch (error) {
          console.log("조회수 증가 실패 (무시 가능):", error);
        }
      } catch (error) {
        console.error("게시글 로드 실패:", error);
        nav(-1);
      }
    };

    loadBoard();
  }, [bno, nav]);

  const handleEdit = () => {
    if (!canModify) {
      alert("작성자 또는 관리자만 수정할 수 있습니다.");
      return;
    }
    if (isAdmin && !isAuthor) {
      alert("관리자 권한으로 게시글을 수정합니다.");
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      title: post.title,
      content: post.content,
    });
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("content", editForm.content);

      await postModifyBoard(bno, formData);

      // 수정된 데이터로 post 상태 업데이트
      setPost({
        ...post,
        title: editForm.title,
        content: editForm.content,
      });

      setIsEditing(false);
      alert("게시글이 수정되었습니다.");
    } catch (error) {
      console.error("수정 실패:", error);
      alert("게시글 수정에 실패했습니다.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = async () => {
    const confirmMessage = isAdmin 
      ? "관리자 권한으로 이 게시글을 삭제하시겠습니까?" 
      : "정말로 이 게시글을 삭제하시겠습니까?";
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteBoard(bno);
      const successMessage = isAdmin 
        ? "관리자 권한으로 게시글이 삭제되었습니다." 
        : "게시글이 삭제되었습니다.";
      alert(successMessage);
      nav("/board/list"); // 목록 페이지로 이동
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("게시글 삭제에 실패했습니다.");
    }
  };

  // 현재 사용자가 게시글 작성자이거나 관리자인지 확인
  const isAuthor = post && loginState.email && 
    (post.writer === loginState.email || post.memberEmail === loginState.email);
  
  // 수정/삭제 권한: 작성자이거나 관리자
  const canModify = isAuthor || isAdmin;

  if (!post) return <div>로딩중…</div>;

  return (
    <div className="ReadPage-container">
      {isEditing ? (
        // 수정 모드
        <div className="edit-mode">
          <h2>
            게시글 수정
            {isAdmin && !isAuthor && <span className="admin-badge">(관리자)</span>}
          </h2>
          <div className="edit-form">
            <div className="form-group">
              <label htmlFor="title">제목</label>
              <input
                type="text"
                id="title"
                name="title"
                value={editForm.title}
                onChange={handleInputChange}
                className="edit-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="content">내용</label>
              <textarea
                id="content"
                name="content"
                value={editForm.content}
                onChange={handleInputChange}
                className="edit-textarea"
                rows="10"
              />
            </div>
            <div className="button-group">
              <button onClick={handleSave} className="save-btn">
                저장
              </button>
              <button onClick={handleCancel} className="cancel-btn">
                취소
              </button>
              <button onClick={handleDelete} className="delete-btn">
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : (
        // 읽기 모드
        <div className="read-mode">
          <div className="post-header">
            <h1>{post.title}</h1>
            <div className="post-meta">
              <span>
                <strong>작성자:</strong>{" "}
                {post.memberNickname || post.writer || "익명"}
              </span>
              <span className="divider"></span>
              <span>
                <strong>작성일:</strong>{" "}
                {post.date || post.regDate || "알 수 없음"}
              </span>
              <span className="divider"></span>
              <span>
                <strong>조회수:</strong> {post.viewCount || post.views || 0}
              </span>
            </div>
          </div>
          <div className="content-box">
            <p>{post.content}</p>
          </div>
          <div className="button-group">
            {canModify && (
              <>
                <button onClick={handleEdit} className="edit-btn">
                  수정
                </button>
                <button onClick={handleDelete} className="delete-btn">
                  삭제
                </button>
              </>
            )}
            <button onClick={() => nav(-1)} className="list-btn">
              목록
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
