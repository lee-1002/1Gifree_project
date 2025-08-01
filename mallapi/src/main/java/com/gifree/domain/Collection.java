package com.gifree.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_collection")
@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Collection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String memberEmail;

    @Column(nullable = false)
    private Long pno;

    @Column(nullable = false)
    private String pname;

    @Column(nullable = false)
    private int price;

    private String pdesc;

    private String brand;

    @Column(columnDefinition = "TEXT")
    private String uploadFileNames;

    @Column(nullable = false)
    private LocalDateTime addedAt;

    @Column(nullable = false)
    private String source;

    @PrePersist
    protected void onCreate() {
        addedAt = LocalDateTime.now();
    }
} 