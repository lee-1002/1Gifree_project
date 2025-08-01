package com.gifree.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
public class CartItemListDTO {
  
  private Long cino;

  private int qty;

  private Long pno;

  private String pname;

  private int price;

  private Integer salePrice;

  private Integer discountRate;

  private String imageFile;

  public CartItemListDTO(Long cino, int qty, Long pno, String pname, int price, String imageFile){
    this.cino = cino;
    this.qty = qty;
    this.pno = pno;
    this.pname = pname;
    this.price = price;
    this.imageFile = imageFile;
  }

  public CartItemListDTO(Long cino, int qty, Long pno, String pname, int price, Integer salePrice, Integer discountRate, String imageFile){
    this.cino = cino;
    this.qty = qty;
    this.pno = pno;
    this.pname = pname;
    this.price = price;
    this.salePrice = salePrice;
    this.discountRate = discountRate;
    this.imageFile = imageFile;
  }

}