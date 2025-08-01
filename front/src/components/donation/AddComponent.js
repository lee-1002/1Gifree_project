import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { postAdd, addImageFilesForBoard } from "../../api/donationBoardApi";
import useCustomMove from "../../hooks/useCustomMove";
import ResultModal from "../common/ResultModal";
import Quill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { API_SERVER_HOST } from "../../api/backendApi";
import { getCookie } from "../../util/cookieUtil";

const initState = {
  title: "",
  writer: "",
  content: "",
  category: "LOW_INCOME_CHILDREN", // 기본값 설정
  uploadFileNames: [],
};

// 카테고리 옵션 정의
const categoryOptions = [
  { value: "LOW_INCOME_CHILDREN", label: "저소득층 아동/청소년 지원" },
  { value: "ANIMAL_SHELTER", label: "유기동물 보호소 후원" },
  { value: "LOW_INCOME_WOMEN", label: "저소득층 여성 청소년" },
  { value: "SINGLE_MOTHER", label: "양육 독립가정" },
  { value: "OTHER", label: "기타" },
];

const AddComponent = () => {
  const [donationBoard, setDonationBoard] = useState({ ...initState });
  const { moveToList } = useCustomMove();
  const quillRef = useRef(null);
  const [result, setResult] = useState({ isSuccess: false, message: null });

  // 컴포넌트 마운트 시 작성자를 "관리자"로 설정
  useEffect(() => {
    setDonationBoard((prev) => ({
      ...prev,
      writer: "관리자",
    }));
  }, []);

  const handleChangeDonationBoard = (e) => {
    const { name, value } = e.target;
    setDonationBoard((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuillChange = (htmlContent) => {
    setDonationBoard((prev) => ({
      ...prev,
      content: htmlContent,
    }));
  };

  const handleClickAdd = () => {
    const textData = {
      title: donationBoard.title,
      writer: donationBoard.writer,
      content: donationBoard.content,
      category: donationBoard.category,
    };

    postAdd(textData)
      .then((addResult) => {
        const tno = addResult.TNO;
        const fileNames = donationBoard.uploadFileNames;

        if (fileNames && fileNames.length > 0) {
          addImageFilesForBoard(tno, fileNames)
            .then(() => {
              setResult({
                isSuccess: true,
                message: "게시글과 파일이 성공적으로 등록되었습니다!",
              });
            })
            .catch((e) => {
              console.error("파일 정보 저장 실패:", e);
              setResult({
                isSuccess: false,
                message: "게시글은 등록되었으나 파일 정보 저장에 실패했습니다.",
              });
            });
        } else {
          setResult({
            isSuccess: true,
            message: "게시글이 성공적으로 등록되었습니다!",
          });
        }
      })
      .catch((e) => {
        console.error("게시글 등록 실패:", e);
        setResult({
          isSuccess: false,
          message: "게시글 등록에 실패했습니다.",
        });
      });
  };

  const imageHandler = useCallback(() => {
    const editor = quillRef.current.getEditor();
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("files", file);

      try {
        const response = await axios.post(
          `${API_SERVER_HOST}/files/upload`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const savedFileName = response.data[0];

        setDonationBoard((prev) => ({
          ...prev,
          uploadFileNames: [...prev.uploadFileNames, savedFileName],
        }));

        const range = editor.getSelection();
        editor.insertEmbed(
          range.index,
          "image",
          `${API_SERVER_HOST}/files/${savedFileName}`
        );
      } catch (error) {
        console.error("이미지 업로드 실패:", error);
        alert("이미지 업로드에 실패했습니다.");
      }
    };
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "image"],
          [{ color: [] }, { background: [] }],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    [imageHandler]
  );

  const closeSuccessModal = () => {
    setResult({ isSuccess: false, message: null });
    moveToList("/donationBoard", {}, false);
  };

  const closeErrorModal = () => {
    setResult({ isSuccess: false, message: null });
  };

  return (
    <div className="border-2 border-sky-200 mt-10 p-4 w-full">
      {result.message && (
        <ResultModal
          title={"처리결과"}
          content={result.message}
          callbackFn={result.isSuccess ? closeSuccessModal : closeErrorModal}
        />
      )}
      <p className="text-2xl font-bold mb-6 text-center">게시글 작성</p>
      <div className="space-y-4">
        {/* 작성자 (Writer) - 읽기 전용 */}
        <div className="flex flex-col items-start w-full">
          <div className="p-1 font-bold">작성자</div>
          <input
            className="w-full p-3 rounded-md border border-solid border-neutral-300 bg-gray-100 shadow-sm cursor-not-allowed"
            name="writer"
            type="text"
            value={donationBoard.writer}
            readOnly
            placeholder="로그인한 사용자 정보가 자동으로 입력됩니다."
          />
        </div>

        {/* 제목 (Title) */}
        <div className="flex flex-col items-start w-full">
          <div className="p-1 font-bold">제목</div>
          <input
            className="w-full p-3 rounded-md border border-solid border-neutral-300 focus:border-blue-500 focus:ring focus:ring-blue-200 shadow-sm"
            name="title"
            type="text"
            value={donationBoard.title}
            onChange={handleChangeDonationBoard}
            placeholder="제목을 입력해주세요."
          />
        </div>

        {/* 카테고리 선택 */}
        <div className="flex flex-col items-start w-full">
          <div className="p-1 font-bold">카테고리</div>
          <select
            className="w-full p-3 rounded-md border border-solid border-neutral-300 focus:border-blue-500 focus:ring focus:ring-blue-200 shadow-sm"
            name="category"
            value={donationBoard.category}
            onChange={handleChangeDonationBoard}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 내용 (Content) */}
        <div className="flex flex-col items-start w-full">
          <div className="p-1 font-bold">내용</div>
          <Quill
            ref={quillRef}
            className="w-full border border-solid border-neutral-300 rounded-md shadow-sm"
            // style 속성에서 고정 높이를 제거하고, minHeight를 지정하여 최소 높이만 설정합니다.
            style={{ height: "auto", minHeight: "300px" }}
            theme="snow"
            value={donationBoard.content}
            onChange={handleQuillChange}
            placeholder="내용을 입력해주세요."
            modules={modules}
            formats={[
              "header",
              "bold",
              "italic",
              "underline",
              "strike",
              "list",
              "bullet",
              "align",
              "link",
              "image",
              "color",
              "background",
              "clean",
            ]}
          />
          <div className="h-4"></div>
        </div>
      </div>
      <div className="flex justify-center mt-6">
        <button
          type="button"
          className="rounded px-8 py-3 bg-blue-500 text-xl text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
          onClick={handleClickAdd}
        >
          등록
        </button>
      </div>
    </div>
  );
};

export default AddComponent;
