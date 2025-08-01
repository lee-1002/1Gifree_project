package com.gifree.domain;

import java.time.LocalDate;
import java.util.ArrayList; 
import java.util.List;

import org.hibernate.annotations.BatchSize;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tbl_donationboard")
@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DonationBoard {
  
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long tno;
  
  private String title;

  private String writer;

     @Column(columnDefinition = "TEXT")
  private String content;

  private boolean complete;

  private LocalDate dueDate;

  // 카테고리 필드 추가
  @Enumerated(EnumType.STRING)
  private DonationCategory category;

    // @ElementCollection을 사용하여 별도의 테이블에 파일명들을 저장하도록 매핑합니다.
    @ElementCollection(fetch = FetchType.LAZY)
    @Builder.Default // Lombok @Builder 사용 시 기본값 설정을 위해 필요
    @CollectionTable(name = "tbl_donationboard_images", //이미지 파일명들을 저장할 새로운 테이블
                     joinColumns = @JoinColumn(name = "tno")) // tbl_donationboard의 tno와 연결
    // N+1 쿼리 문제를 완화하기 위한 @BatchSize (선택 사항이지만 권장)이라고 함.
    @BatchSize(size = 100) 
    private List<String> uploadFileNames = new ArrayList<>(); // 초기화하여 null 방지

    // 상태 변경 메서드들 (기존 코드 유지)
    public void changeTitle(String title){
        this.title = title;
    }

    public void changeContent(String content){
        this.content = content;
    }

    public void changeComplete(boolean complete){
        this.complete = complete;
    }

    public void changeDueDate(LocalDate dueDate){
        this.dueDate = dueDate;
    }

    // 카테고리 변경 메서드 추가
    public void changeCategory(DonationCategory category){
        this.category = category;
    }

    // 
    public void addImage(String fileName) {
        if (uploadFileNames == null) { // 혹시 모를 null 체크
            uploadFileNames = new ArrayList<>();
        }
        uploadFileNames.add(fileName);
    }

    public void clearImages() {
        if (uploadFileNames != null) {
            uploadFileNames.clear();
        }
    }
}

