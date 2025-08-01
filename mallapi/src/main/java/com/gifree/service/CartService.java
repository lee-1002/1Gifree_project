package com.gifree.service;

import java.util.List;
import com.gifree.dto.CartItemDTO;
import com.gifree.dto.CartItemListDTO;

import jakarta.transaction.Transactional;

@Transactional
public interface CartService {

  //장바구니 아이템 추가 혹은 변경 
  public List<CartItemListDTO> addOrModify(CartItemDTO cartItemDTO);

  //모든 장바구니 아이템 목록
  public List<CartItemListDTO> getCartItems(String email);

  //아이템 삭제 (cino로)
  public List<CartItemListDTO> remove(Long cino);
  
  //아이템 삭제 (pno로)
  public List<CartItemListDTO> removeByPno(String email, Long pno);
  
  //장바구니 개수 조회
  public long getCartCount(String email);
  
}