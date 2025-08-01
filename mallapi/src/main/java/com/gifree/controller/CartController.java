// src/main/java/com/gifree/controller/CartController.java
package com.gifree.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gifree.dto.CartItemDTO;
import com.gifree.dto.CartItemListDTO;
import com.gifree.service.CartService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    @PreAuthorize("isAuthenticated()")
@PostMapping("/change")
public List<CartItemListDTO> changeCart(@RequestBody CartItemDTO itemDTO, 
                                        Principal principal) {

    log.info(itemDTO);
    itemDTO.setEmail(principal.getName()); // 🔐 인증된 사용자 email 강제 설정

    if(itemDTO.getQty() <= 0) {
        // cino가 있으면 cino로 삭제, 없으면 pno로 삭제
        if(itemDTO.getCino() != null) {
            return cartService.remove(itemDTO.getCino());
        } else {
            return cartService.removeByPno(itemDTO.getEmail(), itemDTO.getPno());
        }
    }

    return cartService.addOrModify(itemDTO);
}

  @GetMapping("/items")
  public List<CartItemListDTO> getCartItems(Principal principal){

    String email = principal.getName();
    log.info("-------------------------");
    log.info("email: "+ email);

    return cartService.getCartItems(email);
  }
  @DeleteMapping("/{cino}")
  public List<CartItemListDTO> removeFromCart(@PathVariable("cino") Long cino){
    log.info("cart item no: "+ cino);

    return cartService.remove(cino);
  }

  // 장바구니 개수 조회
  @GetMapping("/count")
  public ResponseEntity<?> getCartCount(Principal principal) {
    try {
      String email = principal.getName();
      long count = cartService.getCartCount(email);
      
      return ResponseEntity.ok(Map.of(
        "count", count
      ));
    } catch (Exception e) {
      log.error("장바구니 개수 조회 중 오류 발생", e);
      return ResponseEntity.status(500).body(Map.of(
        "error", "개수 조회 중 오류가 발생했습니다: " + e.getMessage()
      ));
    }
  }
}