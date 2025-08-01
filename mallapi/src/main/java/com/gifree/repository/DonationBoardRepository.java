package com.gifree.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.gifree.domain.DonationBoard;
import com.gifree.domain.DonationCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query; // Query 어노테이션 import

public interface DonationBoardRepository extends JpaRepository<DonationBoard, Long>{
    @Query("SELECT db FROM DonationBoard db LEFT JOIN FETCH db.uploadFileNames")
    Page<DonationBoard> findAllWithImages(Pageable pageable);
    
    // 카테고리별 조회 메서드 추가
    @Query("SELECT db FROM DonationBoard db LEFT JOIN FETCH db.uploadFileNames WHERE db.category = :category")
    Page<DonationBoard> findByCategoryWithImages(DonationCategory category, Pageable pageable);
}
