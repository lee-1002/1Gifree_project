package com.gifree.service;

import com.gifree.domain.DonationProducts;
import com.gifree.domain.Member;
import com.gifree.domain.Product;
import com.gifree.domain.ProductImage;
import com.gifree.dto.DonationRequestDTO;
import com.gifree.repository.DonationProductsRepository;
import com.gifree.repository.MemberRepository;
import com.gifree.repository.ProductRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import com.gifree.dto.DonationHistoryDTO;

@Service
@RequiredArgsConstructor  // final 필드 생성자 자동 생성
@Slf4j
public class DonationProductsServiceImpl implements DonationProductsService {

    private final DonationProductsRepository donationProductsRepository;
    private final MemberRepository memberRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional 
    public DonationProducts saveDonation(DonationRequestDTO request) {

        // 기부자 정보 조회
        Member donor = memberRepository.findById(request.getDonorEmail())
                .orElseThrow(() -> new IllegalArgumentException("기부자 회원이 존재하지 않습니다."));

        // 기부 전용 상품을 찾거나 생성합니다 (기부용 더미 상품)
        // 기부용 상품이 없으면 새로 생성
        Product donationProduct = productRepository.findAll().stream()
                .filter(p -> "기부".equals(p.getPname()) && "기부".equals(p.getBrand()))
                .findFirst()
                .orElseGet(() -> {
                    // 기부용 상품이 없으면 생성
                    Product newDonationProduct = Product.builder()
                            .pname("기부")
                            .brand("기부")
                            .price(0) // 기부용 상품은 가격 0
                            .pdesc("기부 전용 상품입니다.")
                            .build();
                    return productRepository.save(newDonationProduct);
                });

        // DonationProducts 엔티티를 생성합니다.
        DonationProducts donation = DonationProducts.builder()
                .product(donationProduct) // 기부용 상품 사용
                .donor(donor)
                .amount(request.getAmount())
                .count(request.getCount())
                .userBrand(request.getBrand()) // 사용자가 입력한 브랜드명 저장
                .userPname(request.getPname()) // 사용자가 입력한 상품명 저장
                .userImageFile(request.getImageFile()) // 사용자가 업로드한 이미지 파일명 저장
                .build();

        // DonationProducts를 저장합니다.
        return donationProductsRepository.save(donation);
    }

    @Override
    public List<DonationHistoryDTO> getDonationHistoryByDonorEmail(String email) {
        log.info("기부내역 DTO 조회 시작 - 이메일: {}", email);
        List<DonationProducts> donations = donationProductsRepository.findByDonorEmailWithProductAndDonor(email);
        log.info("조회된 기부 수: {}", donations.size());
        
        return donations.stream()
            .map(donation -> DonationHistoryDTO.builder()
                .dno(donation.getDno())
                .pname(donation.getUserPname() != null ? donation.getUserPname() : "기부") // 사용자 입력 상품명 또는 기본값
                .brand(donation.getUserBrand() != null ? donation.getUserBrand() : "기부") // 사용자 입력 브랜드명 또는 기본값
                .amount(donation.getAmount())
                .count(donation.getCount())
                .createdAt(donation.getCreatedAt())
                .imageFile(donation.getUserImageFile()) // 사용자가 업로드한 이미지 파일명
                .build())
            .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public Optional<DonationProducts> getDonation(Long dno) {
        return donationProductsRepository.findById(dno);
    }
} 