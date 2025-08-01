package com.gifree.controller;

import com.gifree.domain.DonationProducts;
import com.gifree.service.DonationProductsService;
import com.gifree.dto.DonationRequestDTO;
import com.gifree.dto.MemberDTO;
import com.gifree.dto.DonationHistoryDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.security.Principal;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/donations")
public class DonationProductsController {

    private final DonationProductsService donationProductsService;

    @PostMapping
    public ResponseEntity<DonationProducts> createDonation(
        @RequestBody DonationRequestDTO request,
        Principal principal
    ) {
        String currentUserEmail = principal.getName();
        request.setDonorEmail(currentUserEmail);
        
        log.info("기부 요청 - 사용자: {}, 금액: {}, 상품: {}",
                currentUserEmail, request.getAmount(), request.getPname());

        DonationProducts saved = donationProductsService.saveDonation(request);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/donor/{email}")
    public ResponseEntity<List<DonationHistoryDTO>> getDonationsByDonor(@PathVariable String email) {
        List<DonationHistoryDTO> donations = donationProductsService.getDonationHistoryByDonorEmail(email);
        return ResponseEntity.ok(donations);
    }

    @GetMapping("/{dno}")
    public ResponseEntity<DonationProducts> getDonation(@PathVariable Long dno) {
        return donationProductsService.getDonation(dno)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
} 