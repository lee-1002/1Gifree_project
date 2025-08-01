package com.gifree.dto;

import lombok.Data;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Data
public class DonationRequestDTO {

    private Long pno;
    private String donorEmail;
    @NotNull
    @Min(1)
    private Integer amount;
    @NotNull
    @Min(1)
    private Integer count;    
    private String pname;
    private String brand;
    private String imageFile; // 이미지 파일명 추가
    
    public void setDonorEmail(String donorEmail) {
        this.donorEmail = donorEmail;
    }
} 