package com.gifree.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long oino; // 주문 아이템 번호
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ono")
    private Order order; // 주문
    
    private Long pno; // 상품 번호
    private String pname; // 상품명
    private int qty; // 수량
    private int price; // 가격
    private String imageFile; // 이미지 파일명
    
    // Order와의 양방향 관계 설정
    public void setOrder(Order order) {
        this.order = order;
    }
    
    // Builder 패턴 - order 필드 제외
    @Builder
    public OrderItem(Long oino, Long pno, String pname, int qty, int price, String imageFile) {
        this.oino = oino;
        this.pno = pno;
        this.pname = pname;
        this.qty = qty;
        this.price = price;
        this.imageFile = imageFile;
    }
}