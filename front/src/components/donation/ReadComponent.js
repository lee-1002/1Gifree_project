import { useEffect, useState } from "react";
import { getOne } from "../../api/donationBoardApi";
import useCustomMove from "../../hooks/useCustomMove";
import { Link } from "react-router-dom";
import useCustomUserRoles from "../../hooks/useCustomUserRoles";
import useCustomLogin from "../../hooks/useCustomLogin";
import DonationModalComponent from "./DonationModalComponent";
import "quill/dist/quill.snow.css";
import "./ReadComponent.css";

const initState = {
  tno: 0,
  title: "",
  writer: "",
  content: "",
  dueDate: null,
  complete: false,
  category: null,
};
const basePath = "/donationBoard";

// 카테고리 옵션 정의
const categoryOptions = [
  { value: "LOW_INCOME_CHILDREN", label: "저소득층 아동/청소년 지원" },
  { value: "ANIMAL_SHELTER", label: "유기동물 보호소 후원" },
  { value: "LOW_INCOME_WOMEN", label: "저소득층 여성 청소년" },
  { value: "SINGLE_MOTHER", label: "양육 독립가정" },
  { value: "OTHER", label: "기타" },
];

const ReadComponent = ({ tno }) => {
  const [donationBoard, setDonationBoard] = useState(initState);
  const { moveToModify } = useCustomMove();
  const { isAdmin } = useCustomUserRoles();
  const { isLogin } = useCustomLogin();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    getOne(tno).then((data) => {
      console.log(data);
      setDonationBoard(data);
    });
  }, [tno]);

  const handleDonateClick = () => {
    if (!isLogin) {
      alert("로그인이 필요합니다.");
      return;
    }
    setModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col items-center p-4 w-full">
        {/* 제목 섹션 */}
        <div className="w-full flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">{donationBoard.title}</h1>
          <button
            className="donation-donate-button"
            onClick={handleDonateClick}
          >
            기부하기
          </button>
        </div>

        {/* 카테고리 표시 */}
        {donationBoard.category && (
          <div className="w-full mb-4">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {categoryOptions.find(
                (opt) => opt.value === donationBoard.category
              )?.label || donationBoard.category}
            </span>
          </div>
        )}

        <hr className="w-full my-4 border-gray-300" />

        {/* 내용 섹션 */}
        <div className="w-full px-4 ql-editor">
          <div dangerouslySetInnerHTML={{ __html: donationBoard.content }} />
        </div>

        {/* 작성자 섹션 */}
        <hr className="w-full my-4 border-gray-300" />
        <div className="text-center text-sm text-gray-600 mb-4">
          작성자: 관리자
        </div>

        {/* 버튼 섹션 */}
        <div className="flex justify-center p-4 w-full">
          {/* 임시로 모든 사람이 수정 가능하도록 */}
          <button
            type="button"
            className="rounded p-4 m-2 text-xl w-34 text-white bg-red-500 text-center"
            onClick={() => moveToModify(tno, basePath)}
          >
            게시글 수정
          </button>
          <Link
            to="/donationBoard"
            className="rounded p-4 m-2 text-xl w-34 text-white bg-blue-500 text-center"
          >
            게시글 목록
          </Link>
        </div>
      </div>

      <DonationModalComponent
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default ReadComponent;
