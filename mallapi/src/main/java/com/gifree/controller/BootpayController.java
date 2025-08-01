// src/main/java/com/gifree/controller/BootpayController.java
package com.gifree.controller;

import java.util.Map;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import com.gifree.service.OrderService;  // ← OrderService 인터페이스

@RestController
@RequestMapping("/api/bootpay")
public class BootpayController {

    private static final String PRIVATE_KEY = "w/CGAtOo9b/DWPgAEytNeGxdkNAdoE0K9ZVMCVCdaw0=";
    private static final String VERIFY_URL   = "https://api.bootpay.co.kr/v2/receipt";

    private final RestTemplate restTemplate;
    private final OrderService orderService;  // ← 주문·상품 상태 변경용 서비스

    public BootpayController(OrderService orderService) {
        this.restTemplate = new RestTemplate();
        this.orderService = orderService;
    }

    /**
     * receiptId 검증용 엔드포인트
     */
    @GetMapping("/verify/{receiptId}")
    public ResponseEntity<Map> verifyReceipt(@PathVariable String receiptId) {
        // 1) BootPay에 receipt 검증 요청
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(PRIVATE_KEY);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            VERIFY_URL + "/" + receiptId,
            HttpMethod.GET,
            request,
            Map.class
        );

        // 2) 검증이 성공(2xx)일 경우, 연관 상품들 del_flag 처리
        if (response.getStatusCode().is2xxSuccessful()) {
            orderService.markProductsDeletedByReceipt(receiptId);
        }

        // 3) 원래 응답 그대로 반환
        return new ResponseEntity<>(response.getBody(), response.getStatusCode());
    }
}
