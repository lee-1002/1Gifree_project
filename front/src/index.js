import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import store from "./store";

// src/index.js (또는 App 최상단)
window.addEventListener("error", (event) => {
  // 메시지가 Script error. 이고, 파일명이 Kakao 도메인을 포함하면
  if (
    event.message === "Script error." &&
    event.filename.includes("dapi.kakao.com")
  ) {
    event.preventDefault(); // React 에러 오버레이 무시
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
