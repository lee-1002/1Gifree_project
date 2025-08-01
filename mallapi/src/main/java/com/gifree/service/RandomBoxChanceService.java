package com.gifree.service;

import com.gifree.domain.RandomBoxChance;
import com.gifree.domain.Collection;

public interface RandomBoxChanceService {
    
    // 사용자의 랜덤박스 기회 조회
    RandomBoxChance getChances(String memberEmail);
    
    // 구매 금액에 따른 기회 추가 (10,000원당 1회)
    void addChancesFromPurchase(String memberEmail, int purchaseAmount);
    
    // 랜덤박스 기회 사용
    boolean useChance(String memberEmail);
    
    // 남은 기회 수 조회
    int getRemainingChances(String memberEmail);
    
    // 다음 기회까지 남은 금액 계산
    int getAmountToNextChance(String memberEmail);
    
    // 랜덤박스 뽑기(상품 1개 랜덤 선정, 보관함 추가, 판매리스트 숨김)
    Collection drawAndAddToCollection(String memberEmail);
} 