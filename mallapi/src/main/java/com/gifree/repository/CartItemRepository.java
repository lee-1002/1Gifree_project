package com.gifree.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.gifree.domain.CartItem;
import com.gifree.dto.CartItemListDTO;

public interface CartItemRepository extends JpaRepository<CartItem, Long>{

  @Query("select " + 
  " new com.gifree.dto.CartItemListDTO(ci.cino,  ci.qty,  p.pno, p.pname, p.price, p.salePrice, p.discountRate, " +
  "   case when pi.ord = 0 then pi.fileName else null end)  " +
  " from " +
  "   CartItem ci inner join Cart mc on ci.cart = mc " +
  "   left join Product p on ci.product = p " +
  "   left join p.imageList pi" +
  " where " +
  "   mc.owner.email = :email " +
  "   and (p.brand != '기부' or p.brand is null) " +
  "   and (p.pname != '기부' or p.pname is null) " +
  " order by ci desc ")
  public List<CartItemListDTO> getItemsOfCartDTOByEmail(@Param("email") String email);

  @Query("select" +
  " ci "+
  " from " + 
  "   CartItem ci inner join Cart c on ci.cart = c " + 
  " where " +
  "   c.owner.email = :email and ci.product.pno = :pno")
  public CartItem getItemOfPno(@Param("email") String email, @Param("pno") Long pno );

  @Query("select" +
  " ci "+
  " from " + 
  "   CartItem ci inner join Cart c on ci.cart = c " + 
  " where " +
  "   c.owner.email = :email and ci.product.pno = :pno")
  public List<CartItem> getAllItemsOfPno(@Param("email") String email, @Param("pno") Long pno );

  @Modifying
  @Transactional
  @Query("delete from CartItem ci " +
  " where ci in (select ci2 from CartItem ci2 inner join Cart c on ci2.cart = c " +
  "              where c.owner.email = :email and ci2.product.pno = :pno)")
  public void deleteAllByEmailAndPno(@Param("email") String email, @Param("pno") Long pno);

  @Query("select " + 
  "  c.cno " +
  "from " +
  "  Cart c inner join CartItem ci on ci.cart = c " +
  " where " +
  "  ci.cino = :cino")
  public Long getCartFromItem( @Param("cino") Long cino);
  

    @Query("select new com.gifree.dto.CartItemListDTO(ci.cino,  ci.qty,  p.pno, p.pname, p.price, p.salePrice, p.discountRate, " +
  "   case when pi.ord = 0 then pi.fileName else null end)  " +
  " from " + 
  "   CartItem ci inner join Cart mc on ci.cart = mc " +
  "   left join Product p on ci.product = p " +
  "   left join p.imageList pi" +
  " where " + 
  "  mc.cno = :cno " + 
  "   and (p.brand != '기부' or p.brand is null) " +
  "   and (p.pname != '기부' or p.pname is null) " +
  " order by ci desc ")
  public List<CartItemListDTO> getItemsOfCartDTOByCart(@Param("cno") Long cno);

  // 사용자별 장바구니 아이템 개수 조회 (기부 상품 제외)
  @Query("select count(ci) from CartItem ci inner join Cart c on ci.cart = c " +
         "left join Product p on ci.product = p " +
         "where c.owner.email = :email " +
         "and (p.brand != '기부' or p.brand is null) " +
         "and (p.pname != '기부' or p.pname is null)")
  public long countByEmail(@Param("email") String email);

}