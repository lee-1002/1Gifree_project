import React from "react";
import ChatbotUI from "../components/chatbot/ChatbotUI";

const ChatbotPage = () => {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl h-full">
        <ChatbotUI />
      </div>
    </div>
  );
};

export default ChatbotPage;
