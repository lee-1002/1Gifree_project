package com.gifree.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gifree.domain.RandomBoxChance;
import com.gifree.repository.RandomBoxChanceRepository;
import com.gifree.domain.Product;
import com.gifree.repository.ProductRepository;
import com.gifree.service.CollectionService;
import com.gifree.domain.Collection;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class RandomBoxChanceServiceImpl implements RandomBoxChanceService {
    
    private final RandomBoxChanceRepository randomBoxChanceRepository;
    private final ProductRepository productRepository;
    private final CollectionService collectionService;
    
    @Autowired
    private ApplicationContext applicationContext;
    
    @Override
    public RandomBoxChance getChances(String memberEmail) {
        return randomBoxChanceRepository.findByMemberEmail(memberEmail)
                .orElseGet(() -> {
                    // 기회가 없으면 새로 생성
                    RandomBoxChance newChance = RandomBoxChance.builder()
                            .memberEmail(memberEmail)
                            .remainingChances(0)
                            .build();
                    return randomBoxChanceRepository.save(newChance);
                });
    }
    
    @Override
    public void addChancesFromPurchase(String memberEmail, int purchaseAmount) {
        log.info("addChancesFromPurchase 호출됨 - 사용자: {}, 구매금액: {}", memberEmail, purchaseAmount);

        // 1. 누적 구매금액 조회
        OrderService orderService = applicationContext.getBean(OrderService.class);
        int totalPurchaseAmount = orderService.getTotalPurchaseAmount(memberEmail);
        int shouldBeGranted = totalPurchaseAmount / 10000; // 누적 기준 지급되어야 할 총 기회 수

        // 2. 현재까지 지급된 누적 기회 수 조회
        RandomBoxChance chance = getChances(memberEmail);
        int alreadyGranted = chance.getTotalGrantedChances();
        int toGrant = shouldBeGranted - alreadyGranted;

        log.info("누적 구매금액: {}원, 지급되어야 할 총 기회: {}, 이미 지급된 기회: {}, 새로 지급할 기회: {}", totalPurchaseAmount, shouldBeGranted, alreadyGranted, toGrant);

        if (toGrant > 0) {
            chance.addChances(toGrant);
            randomBoxChanceRepository.save(chance);
            log.info("누적 기준 랜덤박스 기회 추가 완료 - 사용자: {}, 새로 추가: {}, 총 지급: {}", memberEmail, toGrant, chance.getTotalGrantedChances());
        } else {
            log.info("추가할 기회가 없음 (누적 구매금액: {}원, 이미 지급된 기회: {})", totalPurchaseAmount, alreadyGranted);
        }
    }
    
    @Override
    public boolean useChance(String memberEmail) {
        RandomBoxChance chance = getChances(memberEmail);
        
        if (chance.useChance()) {
            randomBoxChanceRepository.save(chance);
            log.info("랜덤박스 기회 사용 - 사용자: {}, 남은 기회: {}", 
                    memberEmail, chance.getRemainingChances());
            return true;
        } else {
            log.info("랜덤박스 기회 부족 - 사용자: {}, 남은 기회: {}", 
                    memberEmail, chance.getRemainingChances());
            return false;
        }
    }
    
    @Override
    public int getRemainingChances(String memberEmail) {
        RandomBoxChance chance = getChances(memberEmail);
        return chance.getRemainingChances();
    }
    
    @Override
    public int getAmountToNextChance(String memberEmail) {
        // 사용자의 총 구매 금액 조회
        OrderService orderService = applicationContext.getBean(OrderService.class);
        int totalPurchaseAmount = orderService.getTotalPurchaseAmount(memberEmail);
        
        // 현재까지 획득한 기회 수 계산
        int earnedChances = totalPurchaseAmount / 10000;
        
        // 다음 기회까지 필요한 총 구매 금액
        int requiredAmount = (earnedChances + 1) * 10000;
        
        // 다음 기회까지 남은 금액
        int remainingAmount = requiredAmount - totalPurchaseAmount;
        
        log.info("다음 기회까지 남은 금액 계산 - 사용자: {}, 총 구매금액: {}, 획득 기회: {}, 다음 기회까지: {}원", 
                memberEmail, totalPurchaseAmount, earnedChances, remainingAmount);
        
        return remainingAmount;
    }

    @Override
    public Collection drawAndAddToCollection(String memberEmail) {
        // 1. 기회 차감
        boolean used = useChance(memberEmail);
        if (!used) {
            throw new RuntimeException("랜덤박스 기회가 부족합니다.");
        }

        // 2. 10,000원 이하 & 판매중(delFlag=false) 상품 전체 조회
        List<Product> candidates = productRepository.findAll().stream()
                .filter(p -> !p.isDelFlag() && p.getPrice() <= 10000)
                .toList();
        if (candidates.isEmpty()) {
            throw new RuntimeException("랜덤박스 뽑기 대상 상품이 없습니다.");
        }

        // 3. 랜덤으로 하나 선정
        Product selected = candidates.get((int) (Math.random() * candidates.size()));

        // 4. 보관함에 추가
        String imageFileName = selected.getImageList().isEmpty() ? null : selected.getImageList().get(0).getFileName();
        Collection collection = collectionService.addToCollection(
                memberEmail,
                selected.getPno(),
                selected.getPname(),
                selected.getPrice(),
                selected.getPdesc(),
                selected.getBrand(),
                imageFileName,
                "randombox"
        );

        // 5. 판매리스트에서 숨김(delFlag = true)
        productRepository.updateToDelete(selected.getPno(), true);

        return collection;
    }
} 