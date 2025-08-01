import axios from "axios";
import { getCookie, setCookie } from "./cookieUtil";
import { API_SERVER_HOST } from "../api/backendApi";

const jwtAxios = axios.create();

const refreshJWT = async (accessToken, refreshToken) => {
  const host = API_SERVER_HOST; //localhost:8080

  try {
    const res = await axios.get(
      `${host}/api/member/refresh?refreshToken=${refreshToken}`
    );

    console.log("----------------------");
    console.log("토큰 갱신 성공:", res.data);

    return res.data;
  } catch (error) {
    console.error("토큰 갱신 실패:", error);
    throw error;
  }
};

//before request
const beforeReq = (config) => {
  console.log("🔍 before request.............");
  console.log("요청 URL:", config.url);
  console.log("요청 메서드:", config.method);

  const memberInfo = getCookie("member");

  if (!memberInfo) {
    console.log("❌ Member NOT FOUND");
    return Promise.reject({ response: { data: { error: "REQUIRE_LOGIN" } } });
  }

  const { accessToken } = memberInfo;

  if (!accessToken) {
    console.log("❌ AccessToken NOT FOUND");
    return Promise.reject({ response: { data: { error: "REQUIRE_LOGIN" } } });
  }

  // Authorization (허가)헤더 처리
  config.headers.Authorization = `Bearer ${accessToken}`;
  console.log("✅ Authorization 헤더 설정 완료");

  return config;
};

//fail request
const requestFail = (err) => {
  console.log("request error............");

  return Promise.reject(err);
};

//before return response
const beforeRes = async (res) => {
  console.log("before return response...........");
  console.log(res);

  //'ERROR_ACCESS_TOKEN'
  const data = res.data;

  if (data && data.error === "ERROR_ACCESS_TOKEN") {
    const memberCookieValue = getCookie("member");

    if (!memberCookieValue || !memberCookieValue.refreshToken) {
      console.log("RefreshToken NOT FOUND");
      setCookie("member", "", 0);
      return Promise.reject({ response: { data: { error: "REQUIRE_LOGIN" } } });
    }

    try {
      const result = await refreshJWT(
        memberCookieValue.accessToken,
        memberCookieValue.refreshToken
      );
      console.log("refreshJWT RESULT", result);

      memberCookieValue.accessToken = result.accessToken;
      memberCookieValue.refreshToken = result.refreshToken;

      setCookie("member", JSON.stringify(memberCookieValue), 1);

      //원래의 호출
      const originalRequest = res.config;

      originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;

      return await axios(originalRequest);
    } catch (error) {
      console.error("토큰 갱신 실패:", error);
      setCookie("member", "", 0);
      return Promise.reject({ response: { data: { error: "REQUIRE_LOGIN" } } });
    }
  }
  return res;
};

//fail response
const responseFail = (err) => {
  console.log("response fail error.............");

  // 401 에러 처리
  if (err.response && err.response.status === 401) {
    console.log("401 Unauthorized - 토큰 만료");

    // 토큰 갱신 시도
    const memberCookieValue = getCookie("member");
    if (memberCookieValue && memberCookieValue.refreshToken) {
      console.log("토큰 갱신 시도...");
      return refreshJWT(
        memberCookieValue.accessToken,
        memberCookieValue.refreshToken
      )
        .then((result) => {
          console.log("토큰 갱신 성공, 쿠키 업데이트");
          memberCookieValue.accessToken = result.accessToken;
          memberCookieValue.refreshToken = result.refreshToken;
          setCookie("member", JSON.stringify(memberCookieValue), 1);

          // 원래 요청 재시도
          const originalRequest = err.config;
          originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
          console.log("원래 요청 재시도:", originalRequest.url);
          return axios(originalRequest);
        })
        .catch((refreshError) => {
          console.error("토큰 갱신 실패:", refreshError);
          setCookie("member", "", 0);
          return Promise.reject({
            response: { data: { error: "REQUIRE_LOGIN" } },
          });
        });
    } else {
      console.log("리프레시 토큰 없음");
      setCookie("member", "", 0);
      return Promise.reject({ response: { data: { error: "REQUIRE_LOGIN" } } });
    }
  }

  return Promise.reject(err);
};

jwtAxios.interceptors.request.use(beforeReq, requestFail);

jwtAxios.interceptors.response.use(beforeRes, responseFail);

export default jwtAxios;
