// src/main/java/com/gifree/service/OrderServiceImpl.java
package com.gifree.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gifree.domain.Order;
import com.gifree.domain.OrderItem;
import com.gifree.domain.Product;
import com.gifree.dto.OrderRequestDTO;
import com.gifree.dto.OrderResponseDTO;
import com.gifree.dto.OrderItemResponseDTO;
import com.gifree.repository.OrderRepository;
import com.gifree.repository.OrderItemRepository;
import com.gifree.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepo;
    
    @Autowired
    private ApplicationContext applicationContext;

    @Override
    public OrderResponseDTO placeOrder(OrderRequestDTO req) {
        // 결제 영수증은 선택적으로 처리 (결제 완료 후 업데이트)
        log.info("주문 생성 시작 - memberId: {}, receiptId: {}, items: {}", 
            req.getMemberId(), req.getReceiptId(), req.getItems().size());
        
        // 1) Order 엔티티 생성
        Order order = Order.builder()
            .memberEmail(req.getMemberId())
            .couponCode(req.getCouponCode())
            .orderedAt(LocalDateTime.now())
            .receiptId(req.getReceiptId()) // 영수증 ID 저장 (null 가능)
            .build();

        // 2) OrderItem 생성·추가
        req.getItems().forEach(i -> {
            log.info("상품 처리 중 - pno: {}, qty: {}", i.getPno(), i.getQty());
            
            // 상품 정보 조회
            Product product = productRepo.findById(i.getPno())
                .orElseThrow(() -> new IllegalArgumentException("Invalid pno: " + i.getPno()));
            
            log.info("상품 정보 조회 - pname: {}, price: {}", product.getPname(), product.getPrice());
            
            // 이미지 파일명 가져오기 (첫 번째 이미지 사용)
            String imageFile = null;
            if (product.getImageList() != null && !product.getImageList().isEmpty()) {
                imageFile = product.getImageList().get(0).getFileName();
                log.info("이미지 파일명: {}", imageFile);
            }

            // OrderItem 생성
            OrderItem orderItem = OrderItem.builder()
                .pno(i.getPno())
                .pname(product.getPname()) // 상품명 저장
                .qty(i.getQty())
                .price(product.getPrice()) // 상품 가격 저장
                .imageFile(imageFile) // 이미지 파일명 저장
                .build();
            
            log.info("OrderItem 생성 완료 - pname: {}, qty: {}, price: {}, imageFile: {}", 
                orderItem.getPname(), orderItem.getQty(), orderItem.getPrice(), orderItem.getImageFile());
            
            // Order에 OrderItem 추가 (양방향 관계 설정)
            order.addItem(orderItem);
            
            log.info("OrderItem을 Order에 추가 완료 - order.ono: {}", order.getOno());

            // 3) 주문 즉시 상품 hidden 처리 (delFlag = true)
            productRepo.updateToDelete(i.getPno(), true);
        });

        log.info("주문 저장 전 - items 크기: {}", order.getItems().size());
        
        // 주문 저장
        Order savedOrder = orderRepository.save(order);
        
        log.info("주문 저장 완료 - ono: {}, items 크기: {}", savedOrder.getOno(), savedOrder.getItems().size());
        
        // 저장 후 OrderItem이 실제로 데이터베이스에 저장되었는지 확인
        List<OrderItem> savedItems = orderItemRepository.findByOrderOno(savedOrder.getOno());
        log.info("데이터베이스에서 조회한 OrderItem 수: {}", savedItems.size());
        
        // 구매 상품을 보관함에 자동 추가 (기부 상품 제외)
        try {
            CollectionService collectionService = applicationContext.getBean(CollectionService.class);
            for (OrderItem item : savedItems) {
                // 기부 상품은 보관함에 추가하지 않음
                if (!"기부".equals(item.getPname())) {
                String imageFile = item.getImageFile();
                collectionService.addToCollection(
                    req.getMemberId(),
                    item.getPno(),
                    item.getPname(),
                    item.getPrice(),
                    null, // pdesc는 주문에 없으므로 null
                    null, // brand도 주문에 없으므로 null
                    imageFile, // uploadFileNames는 첫 번째 이미지 파일명
                    "purchase" // source
                );
                }
            }
            log.info("구매 상품을 보관함에 자동 추가 완료 - 사용자: {}", req.getMemberId());
        } catch (Exception e) {
            log.error("구매 상품 보관함 자동 추가 실패 - 사용자: {}, 오류: {}", req.getMemberId(), e.getMessage());
        }
        
        // 구매 금액에 따른 랜덤박스 기회 추가 (10,000원당 1회)
        int totalAmount = savedItems.stream()
                .mapToInt(item -> item.getPrice() * item.getQty())
                .sum();
        
        log.info("총 구매금액 계산: {}원", totalAmount);
        
        if (totalAmount > 0) {
            try {
                RandomBoxChanceService randomBoxChanceService = applicationContext.getBean(RandomBoxChanceService.class);
                log.info("RandomBoxChanceService 빈 조회 성공");
                randomBoxChanceService.addChancesFromPurchase(req.getMemberId(), totalAmount);
                log.info("주문 완료로 인한 랜덤박스 기회 추가 완료 - 사용자: {}, 총 구매금액: {}", req.getMemberId(), totalAmount);
            } catch (Exception e) {
                log.error("랜덤박스 기회 추가 실패 - 사용자: {}, 총 구매금액: {}, 오류: {}", req.getMemberId(), totalAmount, e.getMessage());
            }
        } else {
            log.info("총 구매금액이 0원이므로 랜덤박스 기회 추가하지 않음");
        }
        
        return OrderResponseDTO.builder()
            .ono(savedOrder.getOno())
            .build();
    }

    @Override
    public void markProductsDeletedByReceipt(String receiptId) {
        // 1) receiptId 로 주문 조회 (OrderRepository 에 findByReceiptId 메서드가 있어야 합니다)
        Order order = orderRepository.findByReceiptId(receiptId)
            .orElseThrow(() -> new IllegalArgumentException("Invalid receiptId: " + receiptId));

        // 2) 해당 주문의 모든 아이템에 대해 del_flag = true 처리
        for (OrderItem item : order.getItems()) {
            productRepo.updateToDelete(item.getPno(), true);
        }
    }

    @Override
    public List<OrderResponseDTO> getOrderHistoryByEmail(String email) {
        log.info("구매내역 조회 시작 - 이메일: {}", email);
        List<Order> orders = orderRepository.findByMemberEmailOrderByOrderedAtDesc(email);
        log.info("조회된 주문 수: {}", orders.size());

        return orders.stream()
            .map(order -> {
                log.info("주문 처리 중 - 주문번호: {}", order.getOno());
                
                // OrderItemRepository를 통해 실제 데이터베이스에서 OrderItem 조회
                List<OrderItem> orderItems = orderItemRepository.findByOrderOno(order.getOno());
                log.info("주문 {}의 OrderItem 수: {}", order.getOno(), orderItems.size());

                List<OrderItemResponseDTO> orderItemDTOs;
                if (orderItems.isEmpty()) {
                    log.warn("주문 {}에 OrderItem이 없습니다. 기본 정보로 생성합니다.", order.getOno());
                    
                    // OrderItem이 없는 경우 기본 정보 생성
                    OrderItemResponseDTO defaultItem = OrderItemResponseDTO.builder()
                        .pno(0L)
                        .pname("주문 상품")
                        .qty(1)
                        .price(0)
                        .imageFile(null)
                        .build();
                    orderItemDTOs = new ArrayList<>();
                    orderItemDTOs.add(defaultItem);
                } else {
                    orderItemDTOs = orderItems.stream()
                        .filter(item -> !"기부".equals(item.getPname())) // 기부 상품 필터링
                        .map(item -> {
                            log.info("주문 아이템 처리 - 상품번호: {}, 상품명: {}, 수량: {}, 가격: {}, 이미지: {}",
                                item.getPno(), item.getPname(), item.getQty(), item.getPrice(), item.getImageFile());

                            // OrderItem에 저장된 정보를 우선 사용
                            String imageFile = item.getImageFile();
                            String pname = item.getPname();
                            int price = item.getPrice();

                            // OrderItem에 정보가 없으면 Product에서 조회
                            if (imageFile == null || pname == null || price == 0) {
                                Product product = productRepo.findById(item.getPno()).orElse(null);
                                if (product != null) {
                                    if (pname == null) {
                                        pname = product.getPname();
                                    }
                                    if (price == 0) {
                                        price = product.getPrice();
                                    }
                                    if (imageFile == null && product.getImageList() != null && !product.getImageList().isEmpty()) {
                                        imageFile = product.getImageList().get(0).getFileName();
                                    }
                                }
                            }

                            OrderItemResponseDTO dto = OrderItemResponseDTO.builder()
                                .pno(item.getPno())
                                .pname(pname != null ? pname : "상품명 없음")
                                .qty(item.getQty())
                                .price(price)
                                .imageFile(imageFile)
                                .build();

                            log.info("생성된 DTO - 상품명: {}, 수량: {}, 가격: {}, 이미지: {}",
                                dto.getPname(), dto.getQty(), dto.getPrice(), dto.getImageFile());

                            return dto;
                        })
                        .collect(Collectors.toList());
                }

                return OrderResponseDTO.builder()
                    .ono(order.getOno())
                    .memberEmail(order.getMemberEmail())
                    .orderedAt(order.getOrderedAt())
                    .receiptId(order.getReceiptId())
                    .orderItems(orderItemDTOs)
                    .totalAmount(orderItemDTOs.stream().mapToInt(item -> item.getPrice() * item.getQty()).sum())
                    .build();
            })
            .collect(Collectors.toList());
    }

    @Override
    public int getTotalPurchaseAmount(String email) {
        log.info("총 구매 금액 조회 시작 - 이메일: {}", email);
        
        List<Order> orders = orderRepository.findByMemberEmailOrderByOrderedAtDesc(email);
        int totalAmount = 0;
        
        for (Order order : orders) {
            List<OrderItem> orderItems = orderItemRepository.findByOrderOno(order.getOno());
            for (OrderItem item : orderItems) {
                // 기부 상품은 총 구매 금액에서 제외
                if (!"기부".equals(item.getPname())) {
                totalAmount += item.getPrice() * item.getQty();
                }
            }
        }
        
        log.info("총 구매 금액: {}원", totalAmount);
        return totalAmount;
    }
}
