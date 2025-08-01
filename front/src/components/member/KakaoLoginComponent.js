import { Link } from "react-router-dom";
import { getKakaoLoginLink } from "../../api/kakaoApi";

const KakaoLoginComponent = () => {
  const link = getKakaoLoginLink();

  return (
    <div className="flex flex-col">
      <div className="flex justify-center w-full">
        <div className="m-6 w-3/4">
          <Link
            to={link}
            className={`
              flex items-center justify-center
              h-12
              w-full
              rounded-lg
              bg-[#FEE500]
              hover:bg-[#fde32a]
              active:bg-[#ffd400]
              shadow
              transition
            `}
          >
            {/* 말풍선 아이콘 (채팅버블) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              className="w-5 h-5 mr-2 fill-current text-black"
            >
              <path d="M18 10c0 3.866-3.582 7-8 7-1.933 0-3.737-.625-5.13-1.686L2 17l1.359-2.871C2.593 13.08 2 11.586 2 10 2 6.134 5.582 3 10 3s8 3.134 8 7z" />
            </svg>
            <span className="text-base font-medium text-black">
              카카오 로그인
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default KakaoLoginComponent;
