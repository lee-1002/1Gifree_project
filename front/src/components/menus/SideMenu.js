import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const SideMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const menuRef = useRef(null);

  // 메뉴가 아닌 바깥을 클릭했을 때 메뉴가 닫히는 로직
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !e.target.closest(".floating-button")
      ) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // 팝업 창을 여는 함수
  const openChatbotWindow = () => {
    const width = 450;
    const height = 850;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      "/chatbot-window",
      "gifree-chatbot",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const renderButtons = (
    <div
      ref={menuRef}
      className="flex flex-col items-end space-y-2 animate-[floatUp_0.3s_ease-out]"
    >
      <button
        onClick={openChatbotWindow}
        className="chatbot-trigger w-12 h-12 rounded-full bg-blue-500 text-white text-xs font-bold hover:bg-blue-600"
      >
        챗봇
      </button>
      <Link
        to="/guide"
        className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-center leading-tight hover:bg-gray-300"
      >
        이용
        <br />
        가이드
      </Link>
      <Link
        to="/event"
        className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xs hover:bg-gray-300"
      >
        이벤트
      </Link>
      <Link
        to="/information"
        className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-center leading-tight hover:bg-gray-300"
      >
        고객
        <br />
        센터
      </Link>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="w-12 h-12 rounded-full bg-gray-300 text-xs font-bold hover:bg-gray-400"
      >
        Top
      </button>
    </div>
  );

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2">
        {isMobile ? isMenuOpen && renderButtons : renderButtons}
        {isMobile && (
          <button
            onClick={toggleMenu}
            className="floating-button w-14 h-14 ..."
          >
            ☰
          </button>
        )}
      </div>
      <style>{`@keyframes floatUp { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
    </>
  );
};

export default SideMenu;
