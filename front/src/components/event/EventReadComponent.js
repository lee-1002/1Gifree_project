import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getEventById,
  deleteEventById,
  editEventById,
} from "../../api/eventApi";
import { formatShortDate } from "../../util/dateUtil";
import "./EventRead.css";
import useCustomUserRoles from "../../hooks/useCustomUserRoles";
import ResultModal from "../common/ResultModal";

const IMAGE_BASE_URL = "http://localhost:8080/files";
const EventReadComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const { isAdmin } = useCustomUserRoles();
  const [modal, setModal] = useState({ open: false, msg: "" });
  const [confirm, setConfirm] = useState({
    open: false,
    msg: "",
    onConfirm: null,
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventById(id);
        console.log("서버에서 받은 이벤트 데이터:", data);
        setEvent({
          ...data,
          isActive: data.active, // active를 isActive로 변환
        });
        setEditForm({
          ...data,
          isActive: data.active, // editForm에도 동일하게
          startDate: data.startDate
            ? data.startDate.split(" ")[0] || data.startDate.split("T")[0]
            : "",
          endDate: data.endDate
            ? data.endDate.split(" ")[0] || data.endDate.split("T")[0]
            : "",
        });
      } catch (err) {
        console.error("이벤트 데이터 로딩 실패:", err);
        setError("이벤트를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.");
        // 에러가 발생해도 기본 상태로 설정하여 페이지가 로드되도록 함
        setEvent({
          id: id,
          title: "이벤트를 불러올 수 없습니다",
          description: "",
          storeName: "",
          storeAddress: "",
          startDate: "",
          endDate: "",
          isActive: false,
          imageUrl: null,
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      setLoading(true);
      setError(null);
      fetchEvent();
    }
  }, [id]);

  // 이미지 파일 선택 시 미리보기 생성
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setNewImageFile(null);
      setImagePreview(null);
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const errors = {};

    if (!editForm.title?.trim()) {
      errors.title = "제목은 필수입니다";
    }

    if (editForm.startDate && editForm.endDate) {
      if (new Date(editForm.startDate) > new Date(editForm.endDate)) {
        errors.dates = "시작일이 종료일보다 늦을 수 없습니다";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDelete = async () => {
    setConfirm({
      open: true,
      msg: "정말 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          await deleteEventById(id);
          setModal({ open: true, msg: "삭제되었습니다." });
          navigate("/event");
        } catch (err) {
          console.error(err);
          setModal({ open: true, msg: "삭제 중 오류가 발생했습니다." });
        }
      },
    });
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setModal({ open: true, msg: "입력 내용을 확인해주세요." });
      return;
    }

    const formData = new FormData();

    // JSON 문자열을 'event'라는 key로 blob으로 추가
    const eventPayload = {
      title: editForm.title,
      description: editForm.description,
      start_date: editForm.startDate ? editForm.startDate + " 00:00" : "",
      end_date: editForm.endDate ? editForm.endDate + " 23:59" : "",
      store_name: editForm.storeName,
      store_address: editForm.storeAddress,
      isActive: editForm.isActive,
      image_url: editForm.imageUrl, // 기존 이미지 유지
    };
    console.log("서버로 보낼 데이터:", eventPayload);

    formData.append(
      "event",
      new Blob([JSON.stringify(eventPayload)], {
        type: "application/json",
      })
    );

    // 새 이미지 파일이 있다면 추가
    if (newImageFile) {
      formData.append("image_file", newImageFile);
    }

    try {
      await editEventById(id, formData);
      setModal({ open: true, msg: "수정 완료!" });
      window.location.reload();
      setIsEditing(false);
      const updated = await getEventById(id);
      setEvent(updated);
      setEditForm({
        ...updated,
        startDate: updated.startDate
          ? updated.startDate.split(" ")[0] || updated.startDate.split("T")[0]
          : "",
        endDate: updated.endDate
          ? updated.endDate.split(" ")[0] || updated.endDate.split("T")[0]
          : "",
      });
      setNewImageFile(null);
      setImagePreview(null);
      setValidationErrors({});
    } catch (err) {
      console.error(err);
      setModal({
        open: true,
        msg: "수정 실패: " + (err.message || "알 수 없는 오류"),
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === "checkbox" ? checked : value,
    });

    // 해당 필드의 에러 메시지 제거
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: null });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      ...event,
      startDate: event.startDate
        ? event.startDate.split(" ")[0] || event.startDate.split("T")[0]
        : "",
      endDate: event.endDate
        ? event.endDate.split(" ")[0] || event.endDate.split("T")[0]
        : "",
    });
    setNewImageFile(null);
    setImagePreview(null);
    setValidationErrors({});
  };

  if (loading) return <div className="loading-msg">로딩 중...</div>;
  if (!event || !editForm) return <div>이벤트를 찾을 수 없습니다.</div>;

  return (
    <div className="event-read-container">
      <div className="title-area">
        {isEditing ? (
          <div>
            <input
              name="title"
              value={editForm.title || ""}
              onChange={handleChange}
              placeholder="제목"
              className={validationErrors.title ? "error" : ""}
            />
            {validationErrors.title && (
              <div className="error-text">{validationErrors.title}</div>
            )}
          </div>
        ) : (
          <h1>{event.title}</h1>
        )}
      </div>

      <div className="content-area">
        <div className="top-content">
          <div className="photo-box">
            {isEditing ? (
              <div className="image-upload-section">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="upload-button">
                  이미지 선택
                </label>
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="미리보기" />
                    <p>새 이미지: {newImageFile?.name}</p>
                  </div>
                ) : (
                  <div className="current-image">
                    <img
                      src={
                        event.imageUrl
                          ? `${IMAGE_BASE_URL}/${event.imageUrl}`
                          : "/placeholder.png"
                      }
                      alt={event.title}
                      className="event-photo"
                    />
                    <p>현재 이미지</p>
                  </div>
                )}
              </div>
            ) : (
              <img
                src={
                  event.imageUrl
                    ? `${IMAGE_BASE_URL}/${event.imageUrl}`
                    : "/placeholder.png"
                }
                alt={event.title}
                className="event-photo"
                onError={(e) => {
                  console.log("이미지 로딩 실패:", e.target.src);
                  e.target.src = "/placeholder.png";
                  e.target.style.display = "none";
                }}
              />
            )}
          </div>

          <div className="info-box">
            <div className="info-item">
              <label>가게 상호명</label>
              {isEditing ? (
                <input
                  name="storeName"
                  value={editForm.storeName || ""}
                  onChange={handleChange}
                  placeholder="가게 상호명"
                />
              ) : (
                <div>{event.storeName || "-"}</div>
              )}
            </div>

            <div className="info-item">
              <label>가게 주소</label>
              {isEditing ? (
                <input
                  name="storeAddress"
                  value={editForm.storeAddress || ""}
                  onChange={handleChange}
                  placeholder="가게 주소"
                />
              ) : (
                <div>{event.storeAddress || "-"}</div>
              )}
            </div>

            <div className="info-item">
              <label>기간</label>
              {isEditing ? (
                <div className="date-inputs">
                  <input
                    type="date"
                    name="startDate"
                    value={editForm.startDate}
                    onChange={handleChange}
                  />
                  <span>~</span>
                  <input
                    type="date"
                    name="endDate"
                    value={editForm.endDate}
                    onChange={handleChange}
                  />
                </div>
              ) : (
                <div>
                  {formatShortDate(event.startDate)} ~{" "}
                  {formatShortDate(event.endDate)}
                </div>
              )}
            </div>
            {/* 에러 메시지 (기간과 상태 사이) */}
            {validationErrors.dates && (
              <div
                className="error-text"
                style={{ color: "red", margin: "4px 0" }}
              >
                {validationErrors.dates}
              </div>
            )}

            {/* 활성화 상태 토글 */}
            <div className="info-item">
              <label>상태</label>
              {isEditing ? (
                <div className="status-toggle">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={editForm.isActive}
                      onChange={handleChange}
                    />
                    <span className="slider"></span>
                  </label>
                  <span>{editForm.isActive ? "활성화" : "비활성화"}</span>
                </div>
              ) : (
                <div>
                  <span className={event.isActive ? "active" : "inactive"}>
                    {event.isActive ? "✅ 활성화" : "⛔ 비활성화"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bottom-content">
          <label>이벤트 설명</label>
          {isEditing ? (
            <textarea
              name="description"
              value={editForm.description || ""}
              onChange={handleChange}
              rows={5}
              placeholder="이벤트 설명을 입력하세요"
            />
          ) : (
            <p className="description">{event.description || "설명 없음"}</p>
          )}
        </div>

        <div className="bottom-controls">
          <div className="button-group">
            {!isEditing ? (
              <>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="button-common edit-btn"
                  >
                    수정하기
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={handleDelete}
                    className="button-common delete-btn"
                  >
                    삭제하기
                  </button>
                )}
              </>
            ) : (
              <>
                <button onClick={handleSave} className="save-btn">
                  저장하기
                </button>
                <button onClick={handleCancel}>취소</button>
              </>
            )}
          </div>
        </div>

        <div className="back-button-wrapper">
          <button onClick={() => navigate("/event")} className="back-button">
            목록 보기
          </button>
        </div>
      </div>
      {modal.open && (
        <ResultModal
          title="알림"
          content={modal.msg}
          callbackFn={() => setModal({ open: false, msg: "" })}
        />
      )}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="mb-6 text-lg">{confirm.msg}</div>
            <div className="flex gap-4 justify-center">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => {
                  confirm.onConfirm && confirm.onConfirm();
                  setConfirm({ ...confirm, open: false });
                }}
              >
                확인
              </button>
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setConfirm({ ...confirm, open: false })}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventReadComponent;
