import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const useCustomUserRoles = () => {
  const [currentUserRoles, setCurrentUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserRolesFromCookie = async () => {
      setLoading(true);
      setError(null);
      try {
        const encodedCookieValue = Cookies.get("member");

        if (encodedCookieValue) {
          try {
            // 1. URL 디코딩 수행
            const decodedCookieValue = decodeURIComponent(encodedCookieValue);

            // 2. JSON 파싱 수행
            const userData = JSON.parse(decodedCookieValue);

            // 3. 파싱된 객체에서 'roleNames' 추출
            // 제공해주신 쿠키 구조에 따르면 'roleNames'는 userData 객체의 최상위 속성입니다.
            const roles = userData.roleNames || [];
            setCurrentUserRoles(roles);
          } catch (parseError) {
            setError("사용자 정보를 처리하는 데 실패했습니다.");
            setCurrentUserRoles([]);
          }
        } else {
          setCurrentUserRoles([]);
        }
      } catch (err) {
        setError("인증 정보를 불러오는 중 예상치 못한 오류가 발생했습니다.");
        setCurrentUserRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRolesFromCookie();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  const isAdmin =
    currentUserRoles.includes("ROLE_ADMIN") ||
    currentUserRoles.includes("ADMIN");

  return { currentUserRoles, isAdmin, loading, error };
};

export default useCustomUserRoles;
