import { Suspense, lazy } from "react";
import MyPage from "../pages/member/MyPage";

const Loading = <div>Loading....</div>;
const Login = lazy(() => import("../pages/member/LoginPage"));
const Join = lazy(() => import("../pages/member/JoinPage"));
const Modify = lazy(() => import("../pages/member/ModifyPage"));
const KakaoRedirect = lazy(() => import("../pages/member/KakaoRedirectPage"));

const memberRouter = () => {
  return [
    {
      path: "login",
      element: (
        <Suspense fallback={Loading}>
          <Login />
        </Suspense>
      ),
    },
    {
      path: "join",
      element: (
        <Suspense fallback={Loading}>
          <Join />
        </Suspense>
      ),
    },
    {
      path: "kakao",
      element: (
        <Suspense fallback={Loading}>
          <KakaoRedirect />
        </Suspense>
      ),
    },
    {
      path: "modify",
      element: (
        <Suspense fallback={Loading}>
          <Modify />
        </Suspense>
      ),
    },
    {
      path: "mypage",
      element: <MyPage />,
    },
  ];
};

export default memberRouter;
