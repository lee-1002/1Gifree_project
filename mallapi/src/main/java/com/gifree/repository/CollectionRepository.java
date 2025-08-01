package com.gifree.repository;

import com.gifree.domain.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CollectionRepository extends JpaRepository<Collection, Long> {

    // 사용자별 보관함 조회 (기부 상품 제외)
    @Query("SELECT c FROM Collection c WHERE c.memberEmail = :memberEmail " +
           "AND (c.pname != '기부' OR c.pname IS NULL) " +
           "AND (c.brand != '기부' OR c.brand IS NULL) " +
           "ORDER BY c.addedAt DESC")
    List<Collection> findByMemberEmailOrderByAddedAtDesc(@Param("memberEmail") String memberEmail);

    // 사용자별 보관함 개수 조회 (기부 상품 제외)
    @Query("SELECT COUNT(c) FROM Collection c WHERE c.memberEmail = :memberEmail " +
           "AND (c.pname != '기부' OR c.pname IS NULL) " +
           "AND (c.brand != '기부' OR c.brand IS NULL)")
    long countByMemberEmail(@Param("memberEmail") String memberEmail);

    // 특정 상품이 사용자 보관함에 있는지 확인
    boolean existsByMemberEmailAndPno(String memberEmail, Long pno);

    // 사용자별 특정 출처의 보관함 조회
    List<Collection> findByMemberEmailAndSourceOrderByAddedAtDesc(String memberEmail, String source);

    // 사용자별 보관함 삭제
    void deleteByMemberEmailAndPno(String memberEmail, Long pno);
} 