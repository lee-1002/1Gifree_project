package com.gifree.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DonationHistoryDTO {
    private Long dno;
    private String pname;
    private String brand;
    private Integer amount;
    private Integer count;
    private LocalDateTime createdAt;
    private String imageFile; // 이미지 파일명 추가
} 