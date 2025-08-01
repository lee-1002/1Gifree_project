package com.gifree.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.gifree.domain.DonationCategory;

import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List; 

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DonationBoardDTO {

    private Long tno;

    private String title;

    private String writer;
    
    @Column(columnDefinition = "TEXT")
    private String content;

    private boolean complete;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    // 카테고리 필드 추가
    private DonationCategory category;

    private List<String> uploadFileNames;

}