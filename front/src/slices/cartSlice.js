import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getCartItems, postChangeCart, deleteCartItem } from "../api/cartApi";

export const getCartItemsAsync = createAsyncThunk(
  "getCartItemsAsync",
  async () => {
    try {
      return await getCartItems();
    } catch (error) {
      console.error("장바구니 조회 실패:", error);
      if (error.response?.data?.error === "REQUIRE_LOGIN") {
        throw new Error("로그인이 필요합니다.");
      }
      throw error;
    }
  }
);

export const postChangeCartAsync = createAsyncThunk(
  "postCartItemsAsync",
  async (param) => {
    try {
      return await postChangeCart(param);
    } catch (error) {
      console.error("장바구니 변경 실패:", error);
      if (error.response?.data?.error === "REQUIRE_LOGIN") {
        throw new Error("로그인이 필요합니다.");
      }
      throw error;
    }
  }
);

export const deleteCartItemAsync = createAsyncThunk(
  "deleteCartItemAsync",
  async (cino) => {
    try {
      return await deleteCartItem(cino);
    } catch (error) {
      console.error("장바구니 삭제 실패:", error);
      if (error.response?.data?.error === "REQUIRE_LOGIN") {
        throw new Error("로그인이 필요합니다.");
      }
      throw error;
    }
  }
);

const initState = [];

const cartSlice = createSlice({
  name: "cartSlice",
  initialState: initState,

  extraReducers: (builder) => {
    builder
      .addCase(getCartItemsAsync.fulfilled, (state, action) => {
        console.log("getCartItemsAsync fulfilled");
        return action.payload;
      })
      .addCase(getCartItemsAsync.rejected, (state, action) => {
        console.log("getCartItemsAsync rejected:", action.error.message);
        return [];
      })
      .addCase(postChangeCartAsync.fulfilled, (state, action) => {
        console.log("postCartItemsAsync fulfilled");
        // 장바구니 업데이트 완료 후 이벤트 발생
        window.dispatchEvent(new Event("cartUpdated"));
        window.dispatchEvent(new Event("cartAddSuccess"));
        return action.payload;
      })
      .addCase(postChangeCartAsync.rejected, (state, action) => {
        console.log("postCartItemsAsync rejected:", action.error.message);
        // 에러가 발생해도 기존 상태 유지
        return state;
      })
      .addCase(deleteCartItemAsync.fulfilled, (state, action) => {
        console.log("deleteCartItemAsync fulfilled");
        // 장바구니 삭제 완료 후 이벤트 발생
        window.dispatchEvent(new Event("cartUpdated"));
        window.dispatchEvent(new Event("cartAddSuccess"));
        return action.payload;
      })
      .addCase(deleteCartItemAsync.rejected, (state, action) => {
        console.log("deleteCartItemAsync rejected:", action.error.message);
        // 에러가 발생해도 기존 상태 유지
        return state;
      });
  },
});

export default cartSlice.reducer;
