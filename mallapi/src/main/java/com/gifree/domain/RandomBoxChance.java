package com.gifree.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "tbl_randombox_chance")
@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RandomBoxChance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String memberEmail;
    
    @Column(nullable = false)
    private int remainingChances;
    // 누적 지급된 랜덤박스 기회 수
    @Column(nullable = false)
    private int totalGrantedChances;
    
    @Column(nullable = false)
    private LocalDateTime lastUpdated;
    
    @PrePersist
    protected void onCreate() {
        lastUpdated = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
    
    // 기회 사용 메서드
    public boolean useChance() {
        if (remainingChances > 0) {
            remainingChances--;
            return true;
        }
        return false;
    }
    
    // 기회 추가 메서드
    public void addChances(int count) {
        this.remainingChances += count;
        this.totalGrantedChances += count;
    }
    public void setTotalGrantedChances(int totalGrantedChances) {
        this.totalGrantedChances = totalGrantedChances;
    }
    public int getTotalGrantedChances() {
        return this.totalGrantedChances;
    }
} 