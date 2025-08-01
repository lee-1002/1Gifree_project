// src/main/java/com/gifree/domain/Order.java
package com.gifree.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name="tbl_order")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder(toBuilder = true)
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ono;

    @Column(name = "receipt_id")
    private String receiptId;

    private String memberEmail;

    // 쿠폰 코드 필드
    private String couponCode;

    // 주문 시각 필드
    private LocalDateTime orderedAt;

    @Builder.Default
    @OneToMany(mappedBy="order", cascade=CascadeType.ALL, orphanRemoval=true, fetch=FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();

    // ← 이 메서드를 반드시 포함해야 서비스에서 order.addItem(it) 호출 가능
    public void addItem(OrderItem item) {
        if (item != null) {
            item.setOrder(this);
            this.items.add(item);
        }
    }
}
