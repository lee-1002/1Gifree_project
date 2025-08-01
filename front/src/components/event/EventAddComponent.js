import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addEvent } from "../../api/eventApi";
import "./EventAdd.css"; // 위 CSS를 여기에 저장
import ResultModal from "../common/ResultModal";

const EventAddComponent = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "", //미리보기 위함
    image_file: null, //이미지 파일
    start_date: "",
    end_date: "",
    store_name: "", // 추가
    store_address: "",
    isActive: true,
  });
  const [modal, setModal] = useState({ open: false, msg: "" });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      // 파일 선택 시 파일 객체 저장
      setForm((prev) => ({
        ...prev,
        image_file: files[0] || null,
        // 이미지 URL은 파일 선택 시 미리보기용으로 비워두거나 유지 가능
        image_url: "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataObj = new FormData();

      // 각 필드를 개별적으로 추가 (서버가 일반적인 multipart/form-data를 기대하는 경우)
      formDataObj.append("title", form.title);
      formDataObj.append("description", form.description);
      formDataObj.append("image_url", form.image_url || "");
      formDataObj.append(
        "start_date",
        form.start_date ? form.start_date.replace("T", " ") : ""
      );
      formDataObj.append(
        "end_date",
        form.end_date ? form.end_date.replace("T", " ") : ""
      );
      formDataObj.append("store_name", form.store_name);
      formDataObj.append("store_address", form.store_address);
      formDataObj.append("isActive", form.isActive ? "true" : "false");

      // 이미지 파일이 있으면 추가
      if (form.image_file) {
        formDataObj.append("image_file", form.image_file);
      }

      console.log("🚀 FormData 내용:");
      for (let [key, value] of formDataObj.entries()) {
        console.log(key, value);
      }

      await addEvent(formDataObj);
      setModal({ open: true, msg: "이벤트가 성공적으로 등록되었습니다." });
      navigate("/event");
    } catch (error) {
      setModal({ open: true, msg: "등록 중 오류가 발생했습니다." });
      console.error("상세 에러:", error.response?.data || error.message);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="event-add-form">
      <div className="form-group">
        <label htmlFor="title">제목</label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          type="text"
          placeholder="이벤트 제목을 입력하세요"
          required
        />
      </div>
      <div className="form-row">
        {/* 왼쪽: 사진 업로드 및 URL */}
        <div className="photo-box">
          <label htmlFor="image_file">가게 사진 업로드</label>
          <input
            id="image_file"
            name="image_file"
            type="file"
            accept="image/*"
            onChange={handleChange}
          />
          {/* 이미지 URL 입력 */}
          <label htmlFor="image_url">또는 가게 사진 URL</label>
          <input
            id="image_url"
            name="image_url"
            value={form.image_url ?? ""}
            onChange={handleChange}
            type="url"
            placeholder="https://example.com/image.png"
          />
          {/* 미리보기 */}
          {(form.image_file || form.image_url) && (
            <img
              src={
                form.image_file
                  ? URL.createObjectURL(form.image_file)
                  : form.image_url
              }
              alt="가게 사진"
              style={{
                width: 150,
                height: 150,
                objectFit: "cover",
                marginTop: 8,
              }}
              onLoad={(e) => {
                // ✅ 파일 업로드 시 메모리 해제
                if (form.image_file) URL.revokeObjectURL(e.target.src);
              }}
            />
          )}
        </div>

        {/* 오른쪽: 가게명, 가게주소, 이벤트 기간 */}
        <div className="info-box">
          <div className="form-group">
            <label htmlFor="store_name">가게명</label>
            <input
              id="store_name"
              name="store_name"
              value={form.store_name}
              onChange={handleChange}
              type="text"
              placeholder="가게명을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="store_address">가게 주소</label>
            <input
              id="store_address"
              name="store_address"
              value={form.store_address}
              onChange={handleChange}
              type="text"
              placeholder="가게 주소를 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="start_date">이벤트 기간</label>
            <div className="date-range">
              <input
                id="start_date"
                name="start_date"
                type="datetime-local"
                value={form.start_date}
                onChange={handleChange}
                required
              />
              <span style={{ margin: "0 8px" }}>~</span>
              <input
                id="end_date"
                name="end_date"
                type="datetime-local"
                value={form.end_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* 설명, 활성화, 제출 버튼 등 아래에 계속 */}
      <div className="form-group">
        <label htmlFor="description">설명</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          placeholder="이벤트 설명을 입력하세요"
        />
      </div>

      <div className="form-group checkbox-group">
        <label htmlFor="is_active">활성화</label>
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          checked={form.isActive}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="submit-btn">
        등록
      </button>
      {modal.open && (
        <ResultModal
          title="알림"
          content={modal.msg}
          callbackFn={() => setModal({ open: false, msg: "" })}
        />
      )}
    </form>
  );
};

export default EventAddComponent;
