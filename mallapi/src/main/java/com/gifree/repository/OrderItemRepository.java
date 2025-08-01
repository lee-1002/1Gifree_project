package com.gifree.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gifree.domain.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    
    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.ono = :ono")
    List<OrderItem> findByOrderOno(@Param("ono") Long ono);
    
    // 디버깅용: 모든 OrderItem 조회
    @Query("SELECT oi FROM OrderItem oi")
    List<OrderItem> findAllOrderItems();
} 