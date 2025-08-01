package com.gifree.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tbl_product")
@Getter
@ToString(exclude = "imageList")
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pno;

    private String brand;

    private String pname;

    private int price;

    private Integer discountRate; 

    private Integer salePrice;    

    private String pdesc;

    private boolean delFlag;

    @ElementCollection
    @Builder.Default
    private List<ProductImage> imageList = new ArrayList<>();

    /** 삭제 여부 변경 */
    public void changeDel(boolean delFlag) {
        this.delFlag = delFlag;
    }

    /** 가격 변경 */
    public void changePrice(int price) {
        this.price = price;
    }

    /** 할인가 변경 */
    public void changeSalePrice(Integer salePrice) {
        this.salePrice = salePrice;
    }

    /** 할인율 변경 */
    public void changeDiscountRate(Integer discountRate) {
        this.discountRate = discountRate;
    }

    /** 설명 변경 */
    public void changeDesc(String desc) {
        this.pdesc = desc;
    }

    /** 이름 변경 */
    public void changeName(String name) {
        this.pname = name;
    }

    /** 브랜드 변경 */
    public void changeBrand(String brand) {
        this.brand = brand;
    }

    /** 이미지 추가 */
    public void addImage(ProductImage image) {
        image.setOrd(this.imageList.size());
        imageList.add(image);
    }

    /** 파일명으로 이미지 추가 */
    public void addImageString(String fileName) {
        ProductImage productImage = ProductImage.builder()
                .fileName(fileName)
                .build();
        addImage(productImage);
    }

    /** 이미지 리스트 초기화 */
    public void clearList() {
        this.imageList.clear();
    }
}
