import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addImageFilesForBoard,
  deleteOne,
  getOne,
  putOne,
} from "../../api/donationBoardApi";
import ResultModal from "../common/ResultModal";
import useCustomMove from "../../hooks/useCustomMove";
import Quill from "react-quill";
import "react-quill/dist/quill.snow.css";
import jwtAxios from "../../util/jwtUtil";
import { API_SERVER_HOST } from "../../api/backendApi";
import { getCookie } from "../../util/cookieUtil";

const initState = {
  tno: 0,
  title: "",
  writer: "",
  content: "",
  complete: false,
  uploadFileNames: [],
};

const ModifyComponent = ({ tno }) => {
  const [donationBoard, setDonationBoard] = useState({ ...initState });
  const [result, setResult] = useState(null);
  const { moveToList, moveToRead } = useCustomMove();
  const basePath = "/donationBoard";

  const quillRef = useRef(null);
  const [modal, setModal] = useState({ open: false, msg: "" });

  const imageHandler = useCallback(() => {
    const editor = quillRef.current.getEditor();
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) {
        return;
      }

      const formData = new FormData();
      formData.append("files", file);

      try {
        const response = await jwtAxios.post(
          `${API_SERVER_HOST}/files/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
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
        setModal({
          open: true,
          msg: "이미지 업로드에 실패했습니다. 로그인 상태를 확인해주세요.",
        });
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

  const handleQuillChange = (htmlContent) => {
    setDonationBoard((prev) => ({
      ...prev,
      content: htmlContent,
    }));
  };

  useEffect(() => {
    getOne(tno).then((data) => setDonationBoard(data));
  }, [tno]);

  const handleChangeDonationBoard = (e) => {
    const { name, value } = e.target;
    setDonationBoard((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangeDonationBoardComplete = (e) => {
    const value = e.target.value;
    setDonationBoard((prev) => ({
      ...prev,
      complete: value === "Y",
    }));
  };

  const handleClickModify = () => {
    console.log("=== 수정 프로세스 시작 ===");
    console.log("수정할 데이터:", donationBoard);

    // 토큰 상태 확인
    const memberInfo = getCookie("member");
    console.log("현재 토큰 상태:", memberInfo);
    console.log("사용자 권한:", memberInfo?.roleNames);

    // 권한 확인
    if (!memberInfo?.roleNames || memberInfo.roleNames.length === 0) {
      console.log("❌ 권한 없음 - roleNames가 비어있음");
      alert("권한이 없습니다. 관리자로 로그인해주세요.");
      return;
    }

    const hasPermission = memberInfo.roleNames.some(
      (role) => role === "ROLE_USER" || role === "ROLE_ADMIN"
    );

    console.log("권한 확인 결과:", hasPermission);

    if (!hasPermission) {
      console.log("❌ 권한 없음 - 적절한 권한이 없음");
      alert("수정 권한이 없습니다. 관리자로 로그인해주세요.");
      return;
    }

    // 작성자 확인 (임시 비활성화)
    // const currentUser = memberInfo.nickname || memberInfo.email;
    // const postWriter = donationBoard.writer;

    // console.log("현재 사용자:", currentUser);
    // console.log("게시글 작성자:", postWriter);
    // console.log("작성자 일치 여부:", currentUser === postWriter);

    // if (currentUser !== postWriter) {
    //   console.log("❌ 작성자 불일치");
    //   alert("작성자만 수정할 수 있습니다.");
    //   return;
    // }

    console.log("✅ 모든 검증 통과 - API 호출 시작");
    console.log(
      "API 호출 URL:",
      `${API_SERVER_HOST}/api/donationBoard/${donationBoard.tno}`
    );

    putOne(donationBoard)
      .then((data) => {
        console.log("✅ API 호출 성공!");
        console.log("modify text result: " + data);

        const fileNames = donationBoard.uploadFileNames;
        if (fileNames && fileNames.length > 0) {
          console.log("파일 정보 업데이트 시작...");
          addImageFilesForBoard(tno, fileNames)
            .then(() => {
              console.log("✅ 파일 정보 업데이트 성공");
              setResult("게시글과 파일이 성공적으로 수정되었습니다!");
            })
            .catch((e) => {
              console.error("❌ 파일 정보 수정 실패:", e);
              setResult(
                "게시글은 수정되었으나 파일 정보 업데이트에 실패했습니다."
              );
            });
        } else {
          console.log("✅ 파일 없음 - 수정 완료");
          setResult("게시글이 수정되었습니다!");
        }
      })
      .catch((e) => {
        console.log("❌ API 호출 실패");
        console.error("게시글 수정 실패:", e);
        console.error("에러 상세:", e.response?.data);
        console.error("에러 상태:", e.response?.status);
        console.error("에러 메시지:", e.message);
        console.error("에러 스택:", e.stack);

        // 토큰 만료 에러 처리
        if (e.response?.data?.error === "REQUIRE_LOGIN") {
          console.log("🔄 토큰 만료 에러 발생, 자동 갱신 시도 중...");
          // 토큰 갱신이 자동으로 시도되므로 잠시 대기
          setTimeout(() => {
            // 갱신 후에도 실패하면 로그인 페이지로 이동
            console.log("⏰ 2초 후 로그인 페이지로 이동");
            alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
            window.location.href = "/member/login";
          }, 2000);
          return;
        }

        console.log("❌ 최종 실패 - 사용자에게 에러 메시지 표시");
        setResult(
          `게시글 수정에 실패했습니다. (${
            e.response?.status || "알 수 없는 오류"
          })`
        );
      });
  };

  const handleClickDelete = () => {
    deleteOne(tno).then((data) => {
      console.log("delete result: " + data);
      setResult("Deleted");
    });
  };

  const closeModal = () => {
    setResult(null);
    if (result === "Deleted") {
      moveToList(basePath, {}, false);
    } else {
      moveToRead(tno, basePath);
    }
  };

  return (
    <div className="border-2 border-sky-200 mt-10 p-4 w-full">
      {result ? (
        <ResultModal
          title={"처리결과"}
          content={result}
          callbackFn={closeModal}
        ></ResultModal>
      ) : (
        <></>
      )}
      {modal.open && (
        <ResultModal
          title="알림"
          content={modal.msg}
          callbackFn={() => setModal({ open: false, msg: "" })}
        />
      )}
      <p className="text-2xl font-bold mb-6 text-center">게시글 수정</p>
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
          />
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

      <div className="flex justify-end p-4">
        <button
          type="button"
          className="inline-block rounded p-4 m-2 text-xl w-32 text-white bg-red-500"
          onClick={handleClickDelete}
        >
          삭제
        </button>
        <button
          type="button"
          className="rounded p-4 m-2 text-xl w-32 text-white bg-blue-500"
          onClick={handleClickModify}
        >
          수정
        </button>
      </div>
    </div>
  );
};

export default ModifyComponent;
