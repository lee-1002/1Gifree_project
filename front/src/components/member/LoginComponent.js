// src/components/LoginComponent.js
import React, { useState } from "react";

import { Link } from "react-router-dom";

import useCustomLogin from "../../hooks/useCustomLogin";
import KakaoLoginComponent from "./KakaoLoginComponent";
import ResultModal from "../../components/common/ResultModal";

const initState = {
  email: "",
  pw: "",
};

const LoginComponent = () => {
  const [loginParam, setLoginParam] = useState({ ...initState });
  const { doLogin, moveToPath } = useCustomLogin();
  const [modal, setModal] = useState({ open: false, msg: "" });

  const handleChange = (e) => {
    loginParam[e.target.name] = e.target.value;
    setLoginParam({ ...loginParam });
  };

  const handleClickLogin = () => {
    doLogin(loginParam).then((data) => {
      if (data.error) {
        setModal({ open: true, msg: "이메일과 패스워드를 다시 확인하세요" });
      } else {
        setModal({ open: true, msg: "로그인 성공" });
        moveToPath("/");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        {/* Logo centered */}
        <div className="mb-6">
          <Link to="/">
            <img
              src="/logo5.jpg"
              alt="Gifree 로고"
              className="h-[70px] w-auto mx-auto"
            />
          </Link>
        </div>
        {/* Email Input */}
        <div className="mb-4 mt-16">
          <input
            name="email"
            type="text"
            value={loginParam.email}
            onChange={handleChange}
            placeholder="아이디"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Password Input */}
        <div className="mb-4">
          <input
            name="pw"
            type="password"
            value={loginParam.pw}
            onChange={handleChange}
            placeholder="비밀번호"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Login Button */}
        <button
          onClick={handleClickLogin}
          className="w-full bg-blue-500 hover:shadow-lg text-white font-semibold py-2 rounded-lg transition"
        >
          로그인
        </button>

        {/* Kakao Login */}
        <div className="mt-4">
          <KakaoLoginComponent />
        </div>

        {/* Bottom Links */}
        <div className="mt-6 flex justify-between items-center">
          <Link
            to="/member/join"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            회원가입
          </Link>
          <Link to="/member/find-id" className="text-gray-600 hover:underline">
            아이디 찾기
          </Link>
          <Link to="/member/find-pw" className="text-gray-600 hover:underline">
            비밀번호 찾기
          </Link>
        </div>
      </div>
      {modal.open && (
        <ResultModal
          title="알림"
          content={modal.msg}
          callbackFn={() => setModal({ open: false, msg: "" })}
        />
      )}
    </div>
  );
};

export default LoginComponent;
