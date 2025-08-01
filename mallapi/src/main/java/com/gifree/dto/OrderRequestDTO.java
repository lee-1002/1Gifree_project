package com.gifree.dto;

import lombok.*;

import java.util.List;

// src/main/java/com/gifree/dto/OrderRequestDTO.java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderRequestDTO {
    private String memberId;       
    private String couponCode;     
    private String receiptId;      // ← 부트페이 결제 완료 후 받은 영수증 ID 추가
    private List<Item> items;      

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Item {
        private Long pno;
        private int qty;
    }
}
