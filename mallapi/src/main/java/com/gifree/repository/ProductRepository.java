package com.gifree.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gifree.domain.Product;

public interface ProductRepository extends JpaRepository<Product, Long>{

    @EntityGraph(attributePaths = "imageList")
    @Query("select p from Product p where p.pno = :pno")
    Optional<Product> selectOne(@Param("pno") Long pno);

    @Modifying
    @Query("update Product p set p.delFlag = :flag where p.pno = :pno")
    void updateToDelete(@Param("pno") Long pno, @Param("flag") boolean flag);

    // 상품하나당 이미지 하나의 목록이 보이게 하기 위함. 
    @Query("select p, pi from Product p left join p.imageList pi on pi.ord = 0 where p.delFlag = false")
    Page<Object[]> selectList(Pageable pageable);
    
    // 모든 상품을 가져오는 쿼리 (이미지 유무와 관계없이)
    @Query("select p from Product p where p.delFlag = false")
    Page<Product> selectAllProducts(Pageable pageable);
    
    // 브랜드별 위치 기반 검색 (현재는 브랜드만 필터링)
    @Query("select p, pi from Product p left join p.imageList pi " +
           "where pi.ord = 0 and p.delFlag = false and p.brand = :brand")
    Page<Object[]> findByBrandAndLocation(Pageable pageable, 
                                         @Param("brand") String brand);
    
    // 브랜드별 가격 오름차순 정렬
    @Query("select p from Product p where p.brand = :brand and p.delFlag = false order by p.price asc")
    List<Product> findByBrandOrderByPriceAsc(@Param("brand") String brand);
    
    // 브랜드별 할인가 오름차순 정렬
    @Query("select p from Product p where p.brand = :brand and p.delFlag = false order by p.salePrice asc")
    List<Product> findByBrandOrderBySalePriceAsc(@Param("brand") String brand);
    
    // 키워드 검색 (상품명, 브랜드, 설명에서 검색)
    @Query("select p from Product p where p.delFlag = false and " +
           "(p.pname like %:keyword% or p.brand like %:keyword% or p.pdesc like %:keyword%)")
    Page<Product> findByKeyword(@Param("keyword") String keyword, Pageable pageable);
}