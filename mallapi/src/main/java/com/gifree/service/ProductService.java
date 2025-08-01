package com.gifree.service;

import org.springframework.transaction.annotation.Transactional;

import com.gifree.dto.PageRequestDTO;
import com.gifree.dto.PageResponseDTO;
import com.gifree.dto.ProductDTO;
import com.gifree.dto.StoreDTO;

import java.util.List;

@Transactional
public interface ProductService {
    PageResponseDTO<ProductDTO> getList(PageRequestDTO pageRequestDTO);
    Long register(ProductDTO productDTO);
    ProductDTO get(Long pno);
    void modify(ProductDTO productDTO);
    void remove(Long pno);
    
    // 위치 기반 검색 메서드들
    PageResponseDTO<ProductDTO> getLocationBasedProducts(
            PageRequestDTO pageRequestDTO, 
            Double latitude, 
            Double longitude, 
            String brand, 
            String sortBy);
    
    List<StoreDTO> getNearbyStores(Double latitude, Double longitude, Double radiusKm);
    
    // 가격 순위별 상품 조회
    ProductDTO getNthCheapestProduct(String brand, int rank);
}