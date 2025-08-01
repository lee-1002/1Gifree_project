package com.gifree.domain;

public enum DonationCategory {
    LOW_INCOME_CHILDREN("저소득층 아동/청소년 지원"),
    ANIMAL_SHELTER("유기동물 보호소 후원"),
    LOW_INCOME_WOMEN("저소득층 여성 청소년"),
    SINGLE_MOTHER("양육 독립가정"),
    OTHER("기타");

    private final String displayName;

    DonationCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 