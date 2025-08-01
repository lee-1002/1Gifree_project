import { useDispatch, useSelector } from "react-redux";
import {
  getCartItemsAsync,
  postChangeCartAsync,
  deleteCartItemAsync,
} from "../slices/cartSlice";

const useCustomCart = () => {
  const cartItems = useSelector((state) => state.cartSlice);

  const dispatch = useDispatch();

  const refreshCart = () => {
    dispatch(getCartItemsAsync());
  };

  const changeCart = (param) => {
    dispatch(postChangeCartAsync(param));
  };
  const addToCart = (product) => {
    // 장바구니에 상품 추가
    const cartItem = {
      pno: product.pno,
      qty: product.qty || 1,
      pname: product.pname,
      price: product.price,
      salePrice: product.salePrice,
      brand: product.brand,
      imageUrl: product.imageUrl,
    };

    dispatch(postChangeCartAsync(cartItem));
  };

  const deleteCartItem = (cino) => {
    dispatch(deleteCartItemAsync(cino));
  };

  return { cartItems, refreshCart, changeCart, addToCart, deleteCartItem };
};

export default useCustomCart;
