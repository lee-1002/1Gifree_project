import { useState, useEffect } from 'react';

const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(new Error('위치 정보를 지원하지 않습니다.'));
      return Promise.reject(new Error('위치 정보를 지원하지 않습니다.'));
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const newLocation = { 
            lat: latitude, 
            lng: longitude, 
            accuracy: accuracy 
          };
          
          console.log('위치 정보 상세:', {
            latitude,
            longitude,
            accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed
          });
          
          setLocation(newLocation);
          setIsLoading(false);
          resolve(newLocation);
        },
        (error) => {
          console.error('위치 오류 코드:', error.code);
          console.error('위치 오류 메시지:', error.message);
          
          let errorMessage = "위치를 가져오는데 실패했습니다.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "위치 정보를 사용할 수 없습니다.";
              break;
            case error.TIMEOUT:
              errorMessage = "위치 요청 시간이 초과되었습니다.";
              break;
          }
          
          const locationError = new Error(errorMessage);
          locationError.code = error.code;
          
          setError(locationError);
          setIsLoading(false);
          reject(locationError);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000, // 5분
        }
      );
    });
  };

  useEffect(() => {
    // 컴포넌트 마운트 시 자동으로 위치 가져오기
    getCurrentLocation().catch(() => {
      // 에러는 이미 setError로 처리됨
    });
  }, []);

  return {
    location,
    error,
    isLoading,
    getCurrentLocation
  };
};

export default useLocation; 