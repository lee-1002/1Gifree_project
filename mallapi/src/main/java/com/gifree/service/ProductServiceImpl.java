package com.gifree.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gifree.domain.Product;
import com.gifree.domain.ProductImage;
import com.gifree.dto.PageRequestDTO;
import com.gifree.dto.PageResponseDTO;
import com.gifree.dto.ProductDTO;
import com.gifree.repository.ProductRepository;
import com.gifree.dto.StoreDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    public PageResponseDTO<ProductDTO> getList(PageRequestDTO pageRequestDTO) {

        log.info("getList..............");

        Pageable pageable = PageRequest.of(
                pageRequestDTO.getPage() - 1, // 페이지 시작 번호는 0부터
                pageRequestDTO.getSize(),
                Sort.by("pno").descending());

        // 검색 키워드가 있으면 검색 쿼리 사용, 없으면 전체 목록
        Page<Product> result;
        if (pageRequestDTO.getKeyword() != null && !pageRequestDTO.getKeyword().trim().isEmpty()) {
            log.info("검색 키워드: {}", pageRequestDTO.getKeyword());
            result = productRepository.findByKeyword(pageRequestDTO.getKeyword(), pageable);
        } else {
            log.info("전체 상품 목록 조회");
            result = productRepository.selectAllProducts(pageable);
        }

        List<ProductDTO> dtoList = result.get()
            .filter(product -> !"기부".equals(product.getBrand()) && !"기부".equals(product.getPname())) // 기부 관련 상품 필터링
            .map(product -> {
                log.info("상품 처리 시작: pno={}, brand={}, pname={}", product.getPno(), product.getBrand(), product.getPname());
            
            // 각 상품의 첫 번째 이미지 찾기
            String firstImageFileName = null;
            if (product.getImageList() != null && !product.getImageList().isEmpty()) {
                log.info("이미지 리스트 크기: {}", product.getImageList().size());
                // ord = 0인 이미지를 우선 찾고, 없으면 첫 번째 이미지 사용
                ProductImage firstImage = product.getImageList().stream()
                    .filter(img -> img.getOrd() == 0)
                    .findFirst()
                    .orElse(product.getImageList().get(0));
                firstImageFileName = firstImage.getFileName();
                log.info("첫 번째 이미지 파일명: {}", firstImageFileName);
            } else {
                log.info("이미지 리스트가 비어있음: pno={}", product.getPno());
            }

            // 이미지 URL 생성
            String imageUrl = null;
            if (firstImageFileName != null) {
                imageUrl = "http://localhost:8080/api/products/view/" + firstImageFileName;
                log.info("이미지 URL 생성: {}", imageUrl);
            } else {
                log.info("이미지 파일명이 없음: pno={}", product.getPno());
            }

            ProductDTO productDTO = ProductDTO.builder()
                    .pno(product.getPno())
                    .brand(product.getBrand())
                    .pname(product.getPname())
                    .pdesc(product.getPdesc())
                    .price(product.getPrice())
                    .discountRate(product.getDiscountRate())
                    .salePrice(product.getSalePrice())
                    .delFlag(product.isDelFlag())
                    .uploadFileNames(firstImageFileName != null ? List.of(firstImageFileName) : List.of())
                    .imageUrl(imageUrl)
                    .build();

            return productDTO;
        }).collect(Collectors.toList());

        long totalCount = result.getTotalElements();

        return PageResponseDTO.<ProductDTO>withAll()
                .dtoList(dtoList)
                .totalCount(totalCount)
                .pageRequestDTO(pageRequestDTO)
                .build();
    }

    @Override
    public Long register(ProductDTO productDTO) {
        Product product = dtoToEntity(productDTO);
        Product result = productRepository.save(product);
        return result.getPno();
    }

    private Product dtoToEntity(ProductDTO productDTO) {
        if (productDTO == null) {
            throw new IllegalArgumentException("ProductDTO is null");
        }

        Product.ProductBuilder builder = Product.builder()
                .pno(productDTO.getPno())
                .brand(productDTO.getBrand())
                .pname(productDTO.getPname())
                .pdesc(productDTO.getPdesc())
                .price(productDTO.getPrice())
                .discountRate(productDTO.getDiscountRate())
                .salePrice(productDTO.getSalePrice());

        Product product = builder.build();

        List<String> uploadFileNames = productDTO.getUploadFileNames();
        if (uploadFileNames != null && !uploadFileNames.isEmpty()) {
            for (String fileName : uploadFileNames) {
                product.addImageString(fileName);
            }
        }

        return product;
    }

    @Override
    public ProductDTO get(Long pno) {
        Optional<Product> result = productRepository.selectOne(pno);
        Product product = result.orElseThrow();
        return entityToDTO(product);
    }

    private ProductDTO entityToDTO(Product product) {
        if (product == null) {
            throw new IllegalArgumentException("Product is null");
        }

        ProductDTO.ProductDTOBuilder builder = ProductDTO.builder()
                .pno(product.getPno())
                .brand(product.getBrand())
                .pname(product.getPname())
                .pdesc(product.getPdesc())
                .price(product.getPrice())
                .discountRate(product.getDiscountRate())
                .salePrice(product.getSalePrice())
                .delFlag(product.isDelFlag());

        List<ProductImage> imageList = product.getImageList();
        if (imageList != null && !imageList.isEmpty()) {
            List<String> fileNameList = imageList.stream()
                    .map(ProductImage::getFileName)
                    .collect(Collectors.toList());
            builder.uploadFileNames(fileNameList);
            
            // 첫 번째 이미지의 URL 생성
            String firstImageFileName = imageList.get(0).getFileName();
            String imageUrl = "http://localhost:8080/api/products/view/" + firstImageFileName;
            builder.imageUrl(imageUrl);
        }

        return builder.build();
    }

    @Override
    public void modify(ProductDTO productDTO) {
        Optional<Product> result = productRepository.findById(productDTO.getPno());
        Product product = result.orElseThrow();

        product.changeName(productDTO.getPname());
        product.changeDesc(productDTO.getPdesc());
        product.changePrice(productDTO.getPrice());

        product.clearList();

        List<String> uploadFileNames = productDTO.getUploadFileNames();
        if (uploadFileNames != null && !uploadFileNames.isEmpty()) {
            uploadFileNames.forEach(product::addImageString);
        }

        productRepository.save(product);
    }

    @Override
    public void remove(Long pno) {
        productRepository.deleteById(pno);
    }

    // 위치 기반 상품 검색
    @Override
    public PageResponseDTO<ProductDTO> getLocationBasedProducts(
            PageRequestDTO pageRequestDTO, 
            Double latitude, 
            Double longitude, 
            String brand, 
            String sortBy) {
        
        log.info("getLocationBasedProducts - brand: {}, sortBy: {}", brand, sortBy);
        
        Pageable pageable = PageRequest.of(
                pageRequestDTO.getPage() - 1,
                pageRequestDTO.getSize(),
                Sort.by(sortBy != null ? sortBy : "price").ascending());
        
        Page<Object[]> result = productRepository.findByBrandAndLocation(
                pageable, brand);
        
        List<ProductDTO> dtoList = result.get()
            .filter(arr -> {
                Product product = (Product) arr[0];
                return !"기부".equals(product.getBrand()) && !"기부".equals(product.getPname()); // 기부 관련 상품 필터링
            })
            .map(arr -> {
                Product product = (Product) arr[0];
                ProductImage productImage = (ProductImage) arr[1];
            
            // 이미지 URL 생성
            String imageUrl = null;
            if (productImage != null) {
                imageUrl = "http://localhost:8080/api/products/view/" + productImage.getFileName();
            }
            
            return ProductDTO.builder()
                    .pno(product.getPno())
                    .brand(product.getBrand())
                    .pname(product.getPname())
                    .pdesc(product.getPdesc())
                    .price(product.getPrice())
                    .discountRate(product.getDiscountRate())
                    .salePrice(product.getSalePrice())
                    .delFlag(product.isDelFlag())
                    .uploadFileNames(productImage != null ? List.of(productImage.getFileName()) : List.of())
                    .imageUrl(imageUrl)
                    .build();
        }).collect(Collectors.toList());
        
        return PageResponseDTO.<ProductDTO>withAll()
                .dtoList(dtoList)
                .totalCount(result.getTotalElements())
                .pageRequestDTO(pageRequestDTO)
                .build();
    }
    
    // 근처 매장 검색
    @Override
    public List<StoreDTO> getNearbyStores(Double latitude, Double longitude, Double radiusKm) {
        log.info("getNearbyStores - lat: {}, lng: {}, radius: {}km", latitude, longitude, radiusKm);
        
        // 실제 구현에서는 매장 테이블에서 위치 기반 검색
        // 현재는 더미 데이터 반환
        return List.of(
            StoreDTO.builder()
                .id(1L)
                .name("스타벅스 강남점")
                .address("서울시 강남구 테헤란로 123")
                .latitude(37.5665)
                .longitude(126.9780)
                .distance(0.5)
                .brand("스타벅스")
                .phone("02-1234-5678")
                .businessHours("07:00-22:00")
                .isOpen(true)
                .build(),
            StoreDTO.builder()
                .id(2L)
                .name("스타벅스 홍대점")
                .address("서울시 마포구 홍대로 456")
                .latitude(37.5575)
                .longitude(126.9250)
                .distance(1.2)
                .brand("스타벅스")
                .phone("02-2345-6789")
                .businessHours("07:00-22:00")
                .isOpen(true)
                .build()
        );
    }
    
    // N번째로 저렴한 상품 조회
    @Override
    public ProductDTO getNthCheapestProduct(String brand, int rank) {
        log.info("getNthCheapestProduct - brand: {}, rank: {}", brand, rank);
        
        List<Product> products = productRepository.findByBrandOrderByPriceAsc(brand)
            .stream()
            .filter(product -> !"기부".equals(product.getBrand()) && !"기부".equals(product.getPname())) // 기부 관련 상품 필터링
            .collect(Collectors.toList());
        
        if (products.size() < rank) {
            throw new IllegalArgumentException(
                String.format("브랜드 '%s'의 상품이 %d개 미만입니다. (총 %d개)", 
                    brand, rank, products.size()));
        }
        
        Product product = products.get(rank - 1); // 0-based index
        return entityToDTO(product);
    }
}
