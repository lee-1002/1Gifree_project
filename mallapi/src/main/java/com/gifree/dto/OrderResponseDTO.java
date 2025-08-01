package com.gifree.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderResponseDTO {
    private Long ono; // 생성된 주문번호
    private String memberEmail; // 주문자 이메일
    private LocalDateTime orderedAt; // 주문일시
    private String receiptId; // 결제 영수증 ID
    private List<OrderItemResponseDTO> orderItems; // 주문 상품 목록
    private int totalAmount; // 총 결제 금액
}