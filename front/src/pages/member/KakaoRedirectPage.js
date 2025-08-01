import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getAccessToken, getMemberWithAccessToken } from "../../api/kakaoApi";
import { login } from "../../slices/loginSlice";
import { useDispatch } from "react-redux";
import useCustomLogin from "../../hooks/useCustomLogin";

const KakaoRedirectPage = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { moveToPath } = useCustomLogin();

  const authCode = searchParams.get("code");

  useEffect(() => {
    if (!authCode) return;

    (async () => {
      try {
        // 1) 인가 코드로 카카오 Access Token 발급
        const accessToken = await getAccessToken(authCode);
        console.log("AccessToken:", accessToken);

        // 2) 발급받은 토큰으로 우리 백엔드에 로그인/가입 처리 요청
        const memberInfo = await getMemberWithAccessToken(accessToken);
        console.log("memberInfo:", memberInfo);

        // 3) Redux state + 쿠키에 저장
        dispatch(login(memberInfo));

        // 4) 로그인 후 리다이렉트할 경로
        moveToPath("/"); // 예: 메인(/) or /board/list 등
      } catch (err) {
        console.error("카카오 리다이렉트 처리 중 오류:", err);
        // 필요 시 에러 화면으로 이동하거나 알림 띄우기
      }
    })();
  }, [authCode, dispatch, moveToPath]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>카카오 로그인 처리 중입니다...</p>
    </div>
  );
};

export default KakaoRedirectPage;
