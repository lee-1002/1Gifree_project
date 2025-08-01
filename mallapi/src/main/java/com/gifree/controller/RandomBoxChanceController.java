package com.gifree.controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.gifree.domain.RandomBoxChance;
import com.gifree.domain.Collection;
import com.gifree.service.RandomBoxChanceService;
import com.gifree.repository.MemberRepository;
import com.gifree.domain.Member;
import com.gifree.domain.MemberRole;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/randombox")
public class RandomBoxChanceController {
    
    private final RandomBoxChanceService randomBoxChanceService;
    private final MemberRepository memberRepository;
    
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/chances")
    public ResponseEntity<Map<String, Object>> getChances(Principal principal) {
        String memberEmail = principal.getName();
        RandomBoxChance chance = randomBoxChanceService.getChances(memberEmail);
        int amountToNextChance = randomBoxChanceService.getAmountToNextChance(memberEmail);
        
        Map<String, Object> response = new HashMap<>();
        response.put("remainingChances", chance.getRemainingChances());
        response.put("lastUpdated", chance.getLastUpdated());
        response.put("amountToNextChance", amountToNextChance);
        
        return ResponseEntity.ok(response);
    }
    
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/use")
    public ResponseEntity<Map<String, Object>> useChance(Principal principal) {
        String memberEmail = principal.getName();
        boolean success = randomBoxChanceService.useChance(memberEmail);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        
        if (success) {
            int remainingChances = randomBoxChanceService.getRemainingChances(memberEmail);
            response.put("remainingChances", remainingChances);
            response.put("message", "랜덤박스 기회를 사용했습니다.");
        } else {
            response.put("message", "랜덤박스 기회가 부족합니다.");
        }
        
        return ResponseEntity.ok(response);
    }
    
    // 디버깅용: 수동으로 기회 추가
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/add-manual")
    public ResponseEntity<Map<String, Object>> addChanceManually(Principal principal) {
        String memberEmail = principal.getName();
        RandomBoxChance chance = randomBoxChanceService.getChances(memberEmail);
        chance.addChances(1);
        randomBoxChanceService.getChances(memberEmail); // 저장을 위해 다시 조회
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("remainingChances", chance.getRemainingChances());
        response.put("message", "수동으로 기회 1회를 추가했습니다.");
        
        return ResponseEntity.ok(response);
    }

    // 관리자만 임의로 특정 사용자의 랜덤박스 기회를 늘릴 수 있는 API
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/admin/add-chance")
    public ResponseEntity<?> addChanceByAdmin(
            Principal principal,
            @RequestParam String targetEmail,
            @RequestParam int count) {
        // 1. 관리자 여부 확인
        String adminEmail = principal.getName();
        Member admin = memberRepository.getWithRoles(adminEmail);
        boolean isAdmin = admin.getMemberRoleList().contains(MemberRole.ADMIN);
        if (!isAdmin) {
            return ResponseEntity.status(403).body("관리자만 사용할 수 있습니다.");
        }
        // 2. 대상 사용자 기회 증가
        RandomBoxChance chance = randomBoxChanceService.getChances(targetEmail);
        chance.addChances(count);
        randomBoxChanceService.getChances(targetEmail); // 저장
        return ResponseEntity.ok(Map.of(
            "success", true,
            "targetEmail", targetEmail,
            "added", count,
            "remainingChances", chance.getRemainingChances(),
            "totalGrantedChances", chance.getTotalGrantedChances()
        ));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/draw")
    public ResponseEntity<?> drawRandomBox(Principal principal) {
        String memberEmail = principal.getName();
        try {
            Collection drawn = randomBoxChanceService.drawAndAddToCollection(memberEmail);
            return ResponseEntity.ok(drawn);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
} 