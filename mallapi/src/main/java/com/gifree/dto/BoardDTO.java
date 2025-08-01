package com.gifree.dto;

import com.gifree.domain.Board;
import lombok.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BoardDTO {
    private Long bno;
    private String title;
    private String content;
    private String writer;
    private String memberNickname;
    private String date;
    private String modDate;
    private int viewCount;
    private List<String> images;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public static BoardDTO fromEntity(Board b) {
        return BoardDTO.builder()
            .bno(b.getBno())
            .title(b.getTitle())
            .content(b.getContent())
            .writer(b.getWriter())
            .date(b.getRegDate().format(FMT))
            .modDate(b.getModDate().format(FMT))
            .viewCount(b.getViewCount())
            // .images(
            //     b.getImages().stream()
            //      .map(img -> img.getFileName())
            //      .collect(Collectors.toList())
            // )
            
            .build();
    }
}