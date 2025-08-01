package com.gifree.service;

import com.gifree.domain.Collection;
import java.util.List;

public interface CollectionService {

    // 보관함에 상품 추가
    Collection addToCollection(String memberEmail, Long pno, String pname, int price, 
                              String pdesc, String brand, String uploadFileNames, String source);

    // 사용자별 보관함 조회
    List<Collection> getCollectionByEmail(String memberEmail);

    // 보관함에서 상품 삭제
    void removeFromCollection(String memberEmail, Long pno);

    // 사용자별 보관함 개수 조회
    long getCollectionCount(String memberEmail);
} 