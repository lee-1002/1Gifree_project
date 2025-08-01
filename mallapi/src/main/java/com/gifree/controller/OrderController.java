// src/main/java/com/gifree/controller/OrderController.java
package com.gifree.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.gifree.dto.OrderRequestDTO;
import com.gifree.dto.OrderResponseDTO;
import com.gifree.service.OrderService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.gifree.domain.OrderItem;
import com.gifree.repository.OrderItemRepository;
import com.gifree.domain.Order;
import com.gifree.repository.OrderRepository;
import com.gifree.domain.Product;
import com.gifree.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;  // ← 기존 ProductRepository, OrderRepository는 더 이상 직접 쓰지 않습니다
    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @PostMapping
    public ResponseEntity<OrderResponseDTO> placeOrder(
            @RequestBody OrderRequestDTO req) {

        // 1) Service 레이어에 요청을 위임 (트랜잭션 포함)
        OrderResponseDTO resp = orderService.placeOrder(req);

        // 2) 주문번호를 응답
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/history")
    public ResponseEntity<List<OrderResponseDTO>> getOrderHistory(Principal principal) {
        String email = principal.getName();
        List<OrderResponseDTO> orderHistory = orderService.getOrderHistoryByEmail(email);
        return ResponseEntity.ok(orderHistory);
    }

    // 디버깅용: 모든 OrderItem 조회
    @GetMapping("/debug/items")
    public ResponseEntity<?> getAllOrderItems() {
        List<OrderItem> allItems = orderItemRepository.findAllOrderItems();
        return ResponseEntity.ok(Map.of(
            "totalItems", allItems.size(),
            "items", allItems.stream().map(item -> Map.of(
                "oino", item.getOino(),
                "pno", item.getPno(),
                "pname", item.getPname(),
                "qty", item.getQty(),
                "price", item.getPrice(),
                "imageFile", item.getImageFile(),
                "orderOno", item.getOrder() != null ? item.getOrder().getOno() : null
            )).collect(Collectors.toList())
        ));
    }
    
    // 디버깅용: 특정 주문의 OrderItem 조회
    @GetMapping("/debug/order/{ono}/items")
    public ResponseEntity<?> getOrderItemsByOrderNo(@PathVariable Long ono) {
        List<OrderItem> items = orderItemRepository.findByOrderOno(ono);
        return ResponseEntity.ok(Map.of(
            "orderNo", ono,
            "totalItems", items.size(),
            "items", items.stream().map(item -> Map.of(
                "oino", item.getOino(),
                "pno", item.getPno(),
                "pname", item.getPname(),
                "qty", item.getQty(),
                "price", item.getPrice(),
                "imageFile", item.getImageFile()
            )).collect(Collectors.toList())
        ));
    }
    
    // 기존 주문들에 OrderItem 생성 (임시 API)
    @PostMapping("/fix-existing-orders")
    public ResponseEntity<?> fixExistingOrders() {
        try {
            List<Order> orders = orderRepository.findAll();
            List<Product> availableProducts = productRepository.findAll(); // 모든 상품 사용
            int fixedCount = 0;
            
            if (availableProducts.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "사용 가능한 상품이 없습니다."));
            }
            
            for (int i = 0; i < orders.size(); i++) {
                Order order = orders.get(i);
                List<OrderItem> existingItems = orderItemRepository.findByOrderOno(order.getOno());
                
                if (existingItems.isEmpty()) {
                    // 사용 가능한 상품들 중에서 순환하여 선택 (다양한 상품 사용)
                    Product product = availableProducts.get(i % availableProducts.size());
                    
                    // 이미지 파일명 가져오기 (첫 번째 이미지 사용)
                    String imageFile = null;
                    if (product.getImageList() != null && !product.getImageList().isEmpty()) {
                        imageFile = product.getImageList().get(0).getFileName();
                    }

                    // 수량을 1-3개 사이에서 랜덤하게 설정 (더 현실적으로)
                    int randomQty = 1 + (i % 3);

                    OrderItem defaultItem = OrderItem.builder()
                        .pno(product.getPno()) // 실제 존재하는 상품 번호
                        .pname(product.getPname()) // 실제 상품명
                        .qty(randomQty) // 랜덤 수량
                        .price(product.getPrice()) // 실제 가격
                        .imageFile(imageFile) // 실제 이미지
                        .build();
                    
                    defaultItem.setOrder(order);
                    orderItemRepository.save(defaultItem);
                    fixedCount++;
                    
                    log.info("주문 {}에 OrderItem 생성 완료 - pno: {}, pname: {}, qty: {}, price: {}, imageFile: {}", 
                        order.getOno(), product.getPno(), product.getPname(), randomQty, product.getPrice(), imageFile);
                } else {
                    log.info("주문 {}에는 이미 {}개의 OrderItem이 있습니다.", order.getOno(), existingItems.size());
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "message", "기존 주문 수정 완료",
                "totalOrders", orders.size(),
                "fixedOrders", fixedCount,
                "availableProducts", availableProducts.size()
            ));
        } catch (Exception e) {
            log.error("기존 주문 수정 중 오류 발생", e);
            return ResponseEntity.status(500).body(Map.of("error", "수정 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}
