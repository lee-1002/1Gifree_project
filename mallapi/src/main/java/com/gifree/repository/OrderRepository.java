// src/main/java/com/gifree/repository/OrderRepository.java
package com.gifree.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.gifree.domain.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * BootPay 결제 검증 후 receiptId 로 주문을 조회할 때 사용
     */
    Optional<Order> findByReceiptId(String receiptId);

    List<Order> findByMemberEmailOrderByOrderedAtDesc(String email);
}
