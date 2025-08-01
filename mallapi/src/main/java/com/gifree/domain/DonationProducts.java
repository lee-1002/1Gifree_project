package com.gifree.domain;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_donation_product")
@Getter
@ToString(exclude = "donor")
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DonationProducts {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pno", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Product product;  // 필수!

    /** 기부자 (Member 엔티티) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "email", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Member donor;

    /** 기부 금액 */
    @Column(nullable = false)
    private Integer amount;

    /** 기부 횟수 */
    @Column(nullable = false)
    private Integer count;
    
    /** 기부 생성 시간 */
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    /** 사용자가 입력한 브랜드명 */
    @Column(name = "user_brand")
    private String userBrand;
    
    /** 사용자가 입력한 상품명 */
    @Column(name = "user_pname")
    private String userPname;
    
    /** 사용자가 업로드한 이미지 파일명 */
    @Column(name = "user_image_file")
    private String userImageFile;
    
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
} 