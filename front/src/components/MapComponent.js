// src/components/MapComponent.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getList } from "../api/productsApi";
import { API_SERVER_HOST } from "../api/backendApi";
import useCustomCart from "../hooks/useCustomCart";
import useCustomLogin from "../hooks/useCustomLogin";
import { postChangeCartAsync, getCartItemsAsync } from "../slices/cartSlice";
import ResultModal from "./common/ResultModal";
import "./MapComponent.css";

const MapComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const myMarkerRef = useRef(null);

  const [places, setPlaces] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [listType, setListType] = useState("place");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const { cartItems } = useCustomCart();
  const { loginState, isLogin } = useCustomLogin();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [modalCallback, setModalCallback] = useState(null);

  const showModal = (title, content, callback) => {
    setModalTitle(title);
    setModalContent(content);
    setModalCallback(() => callback);
    setModalVisible(true);
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_KEY}` +
      "&autoload=false&libraries=services";
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        // 초기 지도 생성 (기본 위치: 서울 강남)
        mapRef.current = new window.kakao.maps.Map(
          document.getElementById("map"),
          { center: new window.kakao.maps.LatLng(37.4981, 127.0276), level: 3 }
        );

        // 페이지 로드 시 현재 위치로 이동 및 주변 식당 검색
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const currentLocation = new window.kakao.maps.LatLng(
                latitude,
                longitude
              );
              const newLocation = { lat: latitude, lon: longitude };

              // 지도 중심을 현재 위치로 이동
              mapRef.current.setCenter(currentLocation);
              mapRef.current.setLevel(3);

              // 현재 위치 상태 업데이트
              setMyLocation(newLocation);

              // 현재 위치 마커 표시
              showMyLocationMarker(latitude, longitude);

              console.log("현재 위치로 지도 이동 완료:", {
                latitude,
                longitude,
              });

              // 주변 식당 자동 검색
              if (window.kakao.maps.services) {
                const ps = new window.kakao.maps.services.Places();
                clearMarkers();

                ps.keywordSearch(
                  "음식점",
                  (data, status) => {
                    if (
                      status === window.kakao.maps.services.Status.OK &&
                      data.length > 0
                    ) {
                      const results = data
                        .map((p) => ({
                          ...p,
                          distance: getDistance(
                            newLocation.lat,
                            newLocation.lon,
                            parseFloat(p.y),
                            parseFloat(p.x)
                          ),
                        }))
                        .filter((p) => p.distance <= 2000) // 2km 이내
                        .sort((a, b) => a.distance - b.distance);

                      setPlaces(results);
                      setHighlightIndex(null);

                      // 지도에 마커 표시
                      const bounds = new window.kakao.maps.LatLngBounds();
                      results.forEach((place, idx) => {
                        const position = new window.kakao.maps.LatLng(
                          place.y,
                          place.x
                        );
                        const marker = new window.kakao.maps.Marker({
                          position,
                          map: mapRef.current,
                        });
                        const infoWindow = new window.kakao.maps.InfoWindow({
                          content: `<div style="padding:6px;">🍴 ${place.place_name}</div>`,
                        });
                        window.kakao.maps.event.addListener(
                          marker,
                          "click",
                          () => {
                            infoWindowsRef.current.forEach((i) => i.close());
                            infoWindow.open(mapRef.current, marker);
                            mapRef.current.setCenter(position);
                            setHighlightIndex(idx);
                          }
                        );
                        markersRef.current.push(marker);
                        infoWindowsRef.current.push(infoWindow);
                        bounds.extend(position);
                      });

                      // 현재 위치도 bounds에 포함
                      bounds.extend(currentLocation);
                      mapRef.current.setBounds(bounds);

                      // 현재 위치 마커 다시 표시 (bounds 설정 후)
                      showMyLocationMarker(newLocation.lat, newLocation.lon);

                      console.log("주변 식당 검색 완료:", results.length, "개");
                    } else {
                      console.log("주변에 식당이 없습니다.");
                    }
                  },
                  {
                    location: currentLocation,
                    radius: 2000,
                  }
                );
              }
            },
            (error) => {
              console.log("현재 위치를 가져올 수 없습니다:", error);
              // 위치를 가져올 수 없으면 기본 위치 유지
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000, // 5분
            }
          );
        }
      });
    };
    document.head.appendChild(script);

    getList({ page: 1, size: 20 })
      .then((data) => {
        const productList = data.dtoList || data.list || data.content || [];
        setProducts(productList);
        setFilteredProducts(productList);
      })
      .catch(() =>
        showModal(
          "상품 조회 오류",
          "상품 목록을 불러오는 중 문제가 발생했습니다.",
          () => setModalVisible(false)
        )
      );
  }, []);

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371e3;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    infoWindowsRef.current.forEach((i) => i.close());
    markersRef.current = [];
    infoWindowsRef.current = [];
  };

  const showMyLocationMarker = (lat, lon) => {
    if (!mapRef.current) return;
    const pos = new window.kakao.maps.LatLng(lat, lon);
    if (myMarkerRef.current) myMarkerRef.current.setMap(null);
    myMarkerRef.current = new window.kakao.maps.Marker({
      position: pos,
      map: mapRef.current,
      image: new window.kakao.maps.MarkerImage(
        "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png",
        new window.kakao.maps.Size(24, 35),
        { offset: new window.kakao.maps.Point(12, 35) }
      ),
    });
  };

  // 내 위치 주변 음식점 검색
  const searchNearbyRestaurants = useCallback(() => {
    if (!navigator.geolocation) {
      showModal(
        "위치 서비스 오류",
        "브라우저가 위치 서비스를 지원하지 않습니다.",
        () => setModalVisible(false)
      );
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lon: longitude };

        setMyLocation(newLocation);
        showMyLocationMarker(latitude, longitude);

        // 지도 중심을 현재 위치로 이동
        if (mapRef.current) {
          mapRef.current.setCenter(
            new window.kakao.maps.LatLng(latitude, longitude)
          );
          mapRef.current.setLevel(3);
        }

        // 주변 음식점 검색
        if (!window.kakao.maps.services) {
          showModal(
            "지도 서비스 오류",
            "카카오맵 서비스를 불러올 수 없습니다.",
            () => setModalVisible(false)
          );
          setIsLoadingLocation(false);
          return;
        }

        const ps = new window.kakao.maps.services.Places();
        clearMarkers();

        ps.keywordSearch(
          "음식점",
          (data, status) => {
            setIsLoadingLocation(false);

            if (
              status !== window.kakao.maps.services.Status.OK ||
              data.length === 0
            ) {
              setPlaces([]);
              return showModal(
                "검색 결과 없음",
                "주변에 음식점이 없습니다.",
                () => setModalVisible(false)
              );
            }

            const results = data
              .map((p) => ({
                ...p,
                distance: getDistance(
                  newLocation.lat,
                  newLocation.lon,
                  parseFloat(p.y),
                  parseFloat(p.x)
                ),
              }))
              .filter((p) => p.distance <= 2000) // 2km 이내
              .sort((a, b) => a.distance - b.distance);

            setPlaces(results);
            setHighlightIndex(null);

            const bounds = new window.kakao.maps.LatLngBounds();
            results.forEach((place, idx) => {
              const position = new window.kakao.maps.LatLng(place.y, place.x);
              const marker = new window.kakao.maps.Marker({
                position,
                map: mapRef.current,
              });
              const infoWindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:6px;">🍴 ${place.place_name}</div>`,
              });
              window.kakao.maps.event.addListener(marker, "click", () => {
                infoWindowsRef.current.forEach((i) => i.close());
                infoWindow.open(mapRef.current, marker);
                mapRef.current.setCenter(position);
                setHighlightIndex(idx);
              });
              markersRef.current.push(marker);
              infoWindowsRef.current.push(infoWindow);
              bounds.extend(position);
            });
            mapRef.current.setBounds(bounds);
            showMyLocationMarker(newLocation.lat, newLocation.lon);
          },
          {
            location: new window.kakao.maps.LatLng(
              newLocation.lat,
              newLocation.lon
            ),
            radius: 2000,
          }
        );
      },
      (error) => {
        setIsLoadingLocation(false);
        let errorMessage = "위치를 가져오는데 실패했습니다.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "위치 정보를 사용할 수 없습니다.";
            break;
          case error.TIMEOUT:
            errorMessage = "위치 요청 시간이 초과되었습니다.";
            break;
        }

        showModal("위치 오류", errorMessage, () => setModalVisible(false));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5분
      }
    );
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchKeyword.trim()) {
      return showModal("검색 요청 필요", "검색어를 입력해 주세요.", () =>
        setModalVisible(false)
      );
    }
    if (!window.kakao.maps.services) return;

    if (!myLocation) {
      return navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setMyLocation({ lat: latitude, lon: longitude });
        showMyLocationMarker(latitude, longitude);
        setTimeout(handleSearch, 300);
      });
    }

    const ps = new window.kakao.maps.services.Places();
    clearMarkers();
    ps.keywordSearch(
      searchKeyword,
      (data, status) => {
        if (
          status !== window.kakao.maps.services.Status.OK ||
          data.length === 0
        ) {
          setPlaces([]);
          return showModal(
            "검색 결과 없음",
            `"${searchKeyword}"에 대한 결과가 없습니다.`,
            () => setModalVisible(false)
          );
        }
        const results = data
          .map((p) => ({
            ...p,
            distance: getDistance(
              myLocation.lat,
              myLocation.lon,
              parseFloat(p.y),
              parseFloat(p.x)
            ),
          }))
          .filter((p) => p.distance <= 2000)
          .sort((a, b) => a.distance - b.distance);

        setPlaces(results);
        setHighlightIndex(null);

        const bounds = new window.kakao.maps.LatLngBounds();
        results.forEach((place, idx) => {
          const position = new window.kakao.maps.LatLng(place.y, place.x);
          const marker = new window.kakao.maps.Marker({
            position,
            map: mapRef.current,
          });
          const infoWindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:6px;">🍴 ${place.place_name}</div>`,
          });
          window.kakao.maps.event.addListener(marker, "click", () => {
            infoWindowsRef.current.forEach((i) => i.close());
            infoWindow.open(mapRef.current, marker);
            mapRef.current.setCenter(position);
            setHighlightIndex(idx);
          });
          markersRef.current.push(marker);
          infoWindowsRef.current.push(infoWindow);
          bounds.extend(position);
        });
        mapRef.current.setBounds(bounds);
        showMyLocationMarker(myLocation.lat, myLocation.lon);
      },
      {
        location: new window.kakao.maps.LatLng(myLocation.lat, myLocation.lon),
        radius: 2000,
      }
    );
  }, [searchKeyword, myLocation]);

  // 브랜드 검색 핸들러
  const handleBrandSearch = useCallback(
    (keyword) => {
      if (!keyword.trim() || !window.kakao.maps.services) return;

      const ps = new window.kakao.maps.services.Places();
      clearMarkers();

      ps.keywordSearch(
        keyword,
        (data, status) => {
          if (
            status === window.kakao.maps.services.Status.OK &&
            data.length > 0
          ) {
            const results = data
              .map((p) => ({
                ...p,
                distance: myLocation
                  ? getDistance(
                      myLocation.lat,
                      myLocation.lon,
                      parseFloat(p.y),
                      parseFloat(p.x)
                    )
                  : 0,
              }))
              .filter((p) => !myLocation || p.distance <= 5000)
              .sort((a, b) => a.distance - b.distance)
              .slice(0, 10);

            const bounds = new window.kakao.maps.LatLngBounds();
            results.forEach((place) => {
              const position = new window.kakao.maps.LatLng(place.y, place.x);
              const marker = new window.kakao.maps.Marker({
                position,
                map: mapRef.current,
              });
              const infoWindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:6px;">🏪 ${place.place_name}</div>`,
              });
              window.kakao.maps.event.addListener(marker, "click", () => {
                infoWindowsRef.current.forEach((i) => i.close());
                infoWindow.open(mapRef.current, marker);
                mapRef.current.setCenter(position);
              });
              markersRef.current.push(marker);
              infoWindowsRef.current.push(infoWindow);
              bounds.extend(position);
            });

            if (results.length > 0) {
              mapRef.current.setBounds(bounds);
              if (myLocation) {
                showMyLocationMarker(myLocation.lat, myLocation.lon);
              }
            }
          }
        },
        {
          location: myLocation
            ? new window.kakao.maps.LatLng(myLocation.lat, myLocation.lon)
            : null,
          radius: 5000,
        }
      );
    },
    [myLocation]
  );

  // 엔터키 핸들러
  const handleEnterKey = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();

        if (listType === "place") {
          handleSearch();
        } else {
          // 상품 탭일 때 즉시 브랜드 필터링 실행
          if (!searchKeyword.trim()) {
            setFilteredProducts(products);
            clearMarkers();
          } else {
            // 강력한 브랜드 필터링 - 즉시 실행
            const filtered = products.filter((product) => {
              // 브랜드 필드 유효성 검사
              if (
                !product.brand ||
                product.brand === null ||
                product.brand === undefined
              ) {
                return false;
              }

              const productBrand = product.brand
                .toString()
                .toLowerCase()
                .trim();
              const searchValue = searchKeyword.toLowerCase().trim();

              // 정확한 브랜드 매칭
              const isMatch = productBrand === searchValue;

              // 디버깅 로그
              console.log(
                `엔터키 - 상품: ${product.pname}, 브랜드: "${productBrand}", 검색어: "${searchValue}", 매칭: ${isMatch}`
              );

              return isMatch;
            });

            console.log(
              `엔터키 - 검색어: "${searchKeyword}", 필터링된 상품 수: ${filtered.length}`
            );

            // 즉시 필터링된 결과 설정
            setFilteredProducts(filtered);

            // 지도 마커도 즉시 업데이트
            if (window.kakao.maps.services && myLocation) {
              const ps = new window.kakao.maps.services.Places();
              clearMarkers();

              ps.keywordSearch(
                searchKeyword,
                (data, status) => {
                  if (
                    status === window.kakao.maps.services.Status.OK &&
                    data.length > 0
                  ) {
                    const results = data
                      .map((p) => ({
                        ...p,
                        distance: getDistance(
                          myLocation.lat,
                          myLocation.lon,
                          parseFloat(p.y),
                          parseFloat(p.x)
                        ),
                      }))
                      .filter((p) => p.distance <= 5000)
                      .sort((a, b) => a.distance - b.distance)
                      .slice(0, 10);

                    const bounds = new window.kakao.maps.LatLngBounds();
                    results.forEach((place) => {
                      const position = new window.kakao.maps.LatLng(
                        place.y,
                        place.x
                      );
                      const marker = new window.kakao.maps.Marker({
                        position,
                        map: mapRef.current,
                      });
                      const infoWindow = new window.kakao.maps.InfoWindow({
                        content: `<div style="padding:6px;">🏪 ${place.place_name}</div>`,
                      });
                      window.kakao.maps.event.addListener(
                        marker,
                        "click",
                        () => {
                          infoWindowsRef.current.forEach((i) => i.close());
                          infoWindow.open(mapRef.current, marker);
                          mapRef.current.setCenter(position);
                        }
                      );
                      markersRef.current.push(marker);
                      infoWindowsRef.current.push(infoWindow);
                      bounds.extend(position);
                    });

                    if (results.length > 0) {
                      mapRef.current.setBounds(bounds);
                      showMyLocationMarker(myLocation.lat, myLocation.lon);
                    }
                  }
                },
                {
                  location: new window.kakao.maps.LatLng(
                    myLocation.lat,
                    myLocation.lon
                  ),
                  radius: 5000,
                }
              );
            }
          }
        }
      }
    },
    [listType, searchKeyword, products, myLocation]
  );

  const handleAddCart = (pno) => {
    if (!isLogin) {
      showModal("로그인 필요", "장바구니를 이용하려면 로그인 해주세요.", () =>
        navigate("/member/login")
      );
      return;
    }

    let qty = 1;
    const exist = cartItems.find((i) => i.pno === pno);
    if (exist) {
      if (
        !window.confirm(
          "이미 장바구니에 있는 상품입니다. 수량을 추가하시겠습니까?"
        )
      )
        return;
      qty = exist.qty + 1;
    }

    dispatch(postChangeCartAsync({ email: loginState.email, pno, qty }))
      .then((action) => {
        if (action.error) {
          console.error(action.error);
          return showModal("추가 실패", "장바구니 추가에 실패했습니다.", () =>
            setModalVisible(false)
          );
        }
        dispatch(getCartItemsAsync());
        showModal("추가 완료", "상품이 장바구니에 성공적으로 담겼습니다.", () =>
          setModalVisible(false)
        );
      })
      .catch((err) => {
        console.error(err);
        showModal("오류 발생", "장바구니 처리 중 오류가 발생했습니다.", () =>
          setModalVisible(false)
        );
      });
  };

  return (
    <>
      <div className="map-container">
        {/* 지도 영역 */}
        <div className="map-main-content">
          <div className="map-header">
            <h2>우리 동네 기프티콘</h2>
            <p>근처 가게와 상품을 찾아보세요</p>
          </div>
          <div className="search-controls">
            <input
              className="search-input"
              value={searchKeyword}
              onChange={(e) => {
                const value = e.target.value;
                setSearchKeyword(value);

                if (listType === "product") {
                  // 상품 탭일 때 즉시 브랜드 필터링 실행
                  if (!value.trim()) {
                    setFilteredProducts(products);
                    clearMarkers();
                  } else {
                    // 강력한 브랜드 필터링 - 즉시 실행
                    const filtered = products.filter((product) => {
                      // 브랜드 필드 유효성 검사
                      if (
                        !product.brand ||
                        product.brand === null ||
                        product.brand === undefined
                      ) {
                        return false;
                      }

                      const productBrand = product.brand
                        .toString()
                        .toLowerCase()
                        .trim();
                      const searchValue = value.toLowerCase().trim();

                      // 정확한 브랜드 매칭
                      const isMatch = productBrand === searchValue;

                      // 디버깅 로그
                      console.log(
                        `onChange - 상품: ${product.pname}, 브랜드: "${productBrand}", 검색어: "${searchValue}", 매칭: ${isMatch}`
                      );

                      return isMatch;
                    });

                    console.log(
                      `onChange - 검색어: "${value}", 필터링된 상품 수: ${filtered.length}`
                    );

                    // 즉시 필터링된 결과 설정
                    setFilteredProducts(filtered);

                    // 지도 마커도 즉시 업데이트
                    if (window.kakao.maps.services) {
                      // 내 위치가 없으면 먼저 가져오기
                      if (!myLocation) {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const newLocation = {
                                lat: position.coords.latitude,
                                lon: position.coords.longitude,
                              };
                              setMyLocation(newLocation);

                              // 위치를 가져온 후 지도 검색 실행
                              setTimeout(() => handleBrandSearch(value), 100);
                            },
                            (error) => {
                              console.error(
                                "위치를 가져올 수 없습니다:",
                                error
                              );
                              // 위치 없이도 검색 실행
                              handleBrandSearch(value);
                            }
                          );
                        } else {
                          // 위치 지원 안됨
                          handleBrandSearch(value);
                        }
                      } else {
                        // 이미 위치가 있으면 바로 검색
                        handleBrandSearch(value);
                      }
                    }
                  }
                }
              }}
              onKeyUp={handleEnterKey}
              placeholder={
                listType === "place" ? "가게 이름 검색" : "브랜드명 검색"
              }
            />
            <button
              className="btn btn-primary"
              onClick={
                listType === "place"
                  ? handleSearch
                  : () => handleBrandSearch(searchKeyword)
              }
            >
              검색
            </button>
            <button
              className="btn btn-secondary"
              onClick={searchNearbyRestaurants}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? "위치 확인 중..." : "내 위치"}
            </button>
          </div>
          <div className="map-wrapper">
            <div id="map" />
          </div>
        </div>

        {/* 리스트 영역 */}
        <div className="map-sidebar">
          <div className="sidebar-header">
            <h3>📋 결과 리스트</h3>
          </div>
          <div className="tab-container">
            <button
              className={`tab-button ${listType === "place" ? "active" : ""}`}
              onClick={() => {
                setListType("place");
                // 검색창과 지도 초기화 제거
                // setSearchKeyword("");
                // setPlaces([]);
                // setFilteredProducts(products);
                // clearMarkers();
              }}
            >
              가게
            </button>
            <button
              className={`tab-button ${listType === "product" ? "active" : ""}`}
              onClick={() => {
                setListType("product");
                setFilteredProducts(products);
              }}
            >
              상품
            </button>
          </div>
          <div className="list-container">
            {listType === "place" ? (
              places.length === 0 ? (
                <div className="empty-message">가게 검색 결과가 없습니다.</div>
              ) : (
                places.map((place, idx) => (
                  <div
                    key={place.id || `${place.x}-${place.y}`}
                    onClick={() =>
                      window.kakao.maps.event.trigger(
                        markersRef.current[idx],
                        "click"
                      )
                    }
                    className={`place-item ${
                      highlightIndex === idx ? "highlighted" : ""
                    }`}
                  >
                    <div className="place-name">
                      {idx + 1}. {place.place_name}
                    </div>
                    <div className="place-details">
                      {place.road_address_name || place.address_name} ·{" "}
                      <span className="place-distance">
                        {Math.round(place.distance)}m
                      </span>
                    </div>
                  </div>
                ))
              )
            ) : filteredProducts.length === 0 ? (
              <div className="empty-message">상품이 없습니다.</div>
            ) : (
              filteredProducts.map((prod) => (
                <div key={prod.pno} className="product-item">
                  {prod.uploadFileNames[0] && (
                    <img
                      src={`${API_SERVER_HOST}/api/products/view/${prod.uploadFileNames[0]}`}
                      alt={prod.pname}
                      className="product-image"
                    />
                  )}
                  <div className="product-name">{prod.pname}</div>
                  <div className="product-price">
                    {prod.price.toLocaleString()}원
                  </div>
                  <button
                    className="add-cart-btn"
                    onClick={() => handleAddCart(prod.pno)}
                  >
                    🛒 장바구니
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {modalVisible && (
        <ResultModal
          title={modalTitle}
          content={modalContent}
          callbackFn={() => {
            setModalVisible(false);
            modalCallback && modalCallback();
          }}
        />
      )}
    </>
  );
};

export default MapComponent;
