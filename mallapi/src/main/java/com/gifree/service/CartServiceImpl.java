package com.gifree.service;

import java.util.*;

import org.springframework.stereotype.Service;

import com.gifree.domain.*;
import com.gifree.dto.*;
import com.gifree.repository.*;
import com.gifree.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RequiredArgsConstructor
@Service
@Log4j2
public class CartServiceImpl implements CartService {

  private final CartRepository cartRepository;

  private final CartItemRepository cartItemRepository;
  
  private final ProductRepository productRepository;

  @Override
  public List<CartItemListDTO> addOrModify(CartItemDTO cartItemDTO) {

    String email = cartItemDTO.getEmail();

    Long pno = cartItemDTO.getPno();

    int qty = cartItemDTO.getQty();

    Long cino = cartItemDTO.getCino();

    log.info("======================================================");
    log.info(cartItemDTO.getCino() == null);

    if(cino != null) { //장바구니 아이템 번호가 있어서 수량만 변경하는 경우 

      Optional<CartItem> cartItemResult = cartItemRepository.findById(cino);

      CartItem cartItem = cartItemResult.orElseThrow();

      cartItem.changeQty(qty);

      cartItemRepository.save(cartItem);

      return getCartItems(email);
    }

    //장바구니 아이템 번호 cino가 없는 경우 

    //사용자의 카트 
    Cart cart = getCart(email);

    CartItem cartItem = null;

    //이미 동일한 상품이 담긴적이 있을 수 있으므로 
    cartItem = cartItemRepository.getItemOfPno(email, pno);

    if(cartItem == null){
      Product product = Product.builder().pno(pno).build();
      cartItem = CartItem.builder().product(product).cart(cart).qty(qty).build();

    }else {
      cartItem.changeQty(qty);
    }
    
    //상품 아이템 저장 
    cartItemRepository.save(cartItem);

    return getCartItems(email);
  }


  //사용자의 장바구니가 없었다면 새로운 장바구니를 생성하고 반환 
  private Cart getCart(String email ){

    Cart cart = null;

    Optional<Cart> result = cartRepository.getCartOfMember(email);

    if(result.isEmpty()) {

      log.info("Cart of the member is not exist!!");

      Member member = Member.builder().email(email).build();

      Cart tempCart = Cart.builder().owner(member).build();

      cart = cartRepository.save(tempCart);

    }else {
      cart = result.get();
    }
    
    return cart;

  }

  @Override
  public List<CartItemListDTO> getCartItems(String email) {
    // 기부 상품을 장바구니에서 자동으로 제거
    removeDonationItemsFromCart(email);

    return cartItemRepository.getItemsOfCartDTOByEmail(email);
  }

  // 기부 상품을 장바구니에서 제거하는 메서드
  private void removeDonationItemsFromCart(String email) {
    try {
      // 기부 상품의 pno를 찾기
      Long donationPno = getDonationProductPno();
      if (donationPno != null) {
        List<CartItem> donationItems = cartItemRepository.getAllItemsOfPno(email, donationPno);
        
        if (!donationItems.isEmpty()) {
          log.info("기부 상품 {}개를 장바구니에서 제거합니다.", donationItems.size());
          for (CartItem item : donationItems) {
            cartItemRepository.deleteById(item.getCino());
          }
        }
      }
    } catch (Exception e) {
      log.error("기부 상품 제거 중 오류 발생: {}", e.getMessage());
    }
  }

  // 기부 상품의 pno를 가져오는 메서드
  private Long getDonationProductPno() {
    try {
      return productRepository.findAll().stream()
          .filter(p -> "기부".equals(p.getPname()) && "기부".equals(p.getBrand()))
          .findFirst()
          .map(p -> p.getPno())
          .orElse(null);
    } catch (Exception e) {
      log.error("기부 상품 pno 조회 중 오류 발생: {}", e.getMessage());
      return null;
    }
  }

  @Override
  public List<CartItemListDTO> remove(Long cino) {

    Long cno  = cartItemRepository.getCartFromItem(cino);

    log.info("cart no: " + cno);

    cartItemRepository.deleteById(cino);
    
    return cartItemRepository.getItemsOfCartDTOByCart(cno);
  }

  @Override
  public List<CartItemListDTO> removeByPno(String email, Long pno) {
    
    log.info("remove by pno - email: " + email + ", pno: " + pno);
    
    // 해당 상품의 모든 장바구니 아이템 찾기
    List<CartItem> cartItems = cartItemRepository.getAllItemsOfPno(email, pno);
    
    if(!cartItems.isEmpty()) {
      // 첫 번째 아이템의 cart 번호 가져오기 (모두 같은 cart일 것)
      Long cno = cartItems.get(0).getCart().getCno();
      
      // 모든 CartItem 삭제
      cartItemRepository.deleteAllByEmailAndPno(email, pno);
      
      log.info("cart items removed - count: " + cartItems.size() + ", pno: " + pno);
      return cartItemRepository.getItemsOfCartDTOByCart(cno);
    } else {
      log.info("cart items not found for pno: " + pno);
      return getCartItems(email);
    }
  }

  @Override
  public long getCartCount(String email) {
    return cartItemRepository.countByEmail(email);
  }
}