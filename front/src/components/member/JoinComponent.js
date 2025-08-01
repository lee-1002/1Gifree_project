// src/pages/JoinPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const JoinPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");

  const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = (pw) =>
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+~`{}[\]:;"'<>,.?/\\|-]).{8,20}$/.test(
      pw
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isEmailValid(email)) {
      setError("유효한 이메일 형식을 입력해주세요.");
      return;
    }
    if (!isPasswordValid(pw)) {
      setError("비밀번호는 영문, 숫자, 특수문자를 포함해 8~20자여야 합니다.");
      return;
    }
    if (pw !== confirmPw) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const res = await fetch("/api/member/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pw, nickname }),
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "회원가입 실패");
        return;
      }
      alert("회원가입 성공! 로그인 페이지로 이동합니다.");
      navigate("/member/login");
    } catch {
      setError("서버와의 통신 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <Link to="/">
            <img
              src="/logo5.jpg"
              alt="Gifree 로고"
              className="h-[70px] w-auto mx-auto"
            />
          </Link>
        </div>
        <h2 className="text-xl font-semibold text-center text-blue-600 mb-6">
          회원가입
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
            required
          />

          {error && <p className="text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition"
          >
            가입하기
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinPage;
