package com.gifree.dto;

import lombok.*;
import java.util.*;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductDTO {

    private Long pno;

    private String brand;

    private String pname;

    private int price;

    private Integer discountRate;   // 할인율 (nullable)

    private Integer salePrice;      // 할인가 (nullable)

    private String pdesc;

    private boolean delFlag;

    @Builder.Default
    private List<MultipartFile> files = new ArrayList<>();

    @Builder.Default
    private List<String> uploadFileNames = new ArrayList<>();
    
    // 이미지 URL 필드 추가
    private String imageUrl;
}
