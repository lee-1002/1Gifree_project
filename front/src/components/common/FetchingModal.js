import React, { useEffect, useState } from "react";

const ResultModal = ({ title, content, callbackFn }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // 모달이 나타날 때 애니메이션
    setIsVisible(true);
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      if (callbackFn) {
        callbackFn();
      }
    }, 200);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop with blur effect */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

      {/* Modal */}
      <div
        className={`relative w-full max-w-md mx-4 transform transition-all duration-300 ease-out ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } ${isAnimating ? "scale-95 opacity-0" : ""}`}
      >
        {/* Simple clean card */}
        <div className="relative rounded-2xl bg-white shadow-2xl border border-gray-200">
          {/* Content */}
          <div className="px-8 py-12">
            {/* Title */}
            <h3 className="text-xl font-bold text-gray-800 text-center mb-4 leading-tight">
              {title}
            </h3>

            {/* Content */}
            <p className="text-gray-600 text-center mb-8 leading-relaxed">
              {content}
            </p>

            {/* Action buttons */}
            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-gray-300"
              >
                확인
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
