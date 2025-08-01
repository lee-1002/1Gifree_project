// src/main/java/com/gifree/dto/BoardImageDTO.java
package com.gifree.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BoardImageDTO {
    /** 업로드된 파일명 */
    private String fileName;
}
