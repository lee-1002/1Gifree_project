package com.gifree.repository;

import com.gifree.domain.DonationProducts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DonationProductsRepository extends JpaRepository<DonationProducts, Long> {
    // 특정 기부자 이메일로 기부내역 조회 (기본 메서드)
    List<DonationProducts> findByDonor_Email(String email);
    
    // 특정 기부자 이메일로 기부내역 조회 (Product와 Member 정보 포함)
    @Query("SELECT dp FROM DonationProducts dp " +
           "LEFT JOIN FETCH dp.product p " +
           "LEFT JOIN FETCH dp.donor d " +
           "WHERE d.email = :email " +
           "ORDER BY dp.dno DESC")
    List<DonationProducts> findByDonorEmailWithProductAndDonor(@Param("email") String email);
} 