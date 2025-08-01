package com.gifree.service;

import com.gifree.domain.Collection;
import com.gifree.repository.CollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class CollectionServiceImpl implements CollectionService {

    private final CollectionRepository collectionRepository;

    @Override
    public Collection addToCollection(String memberEmail, Long pno, String pname, int price, 
                                    String pdesc, String brand, String uploadFileNames, String source) {
        
        // 기부 상품은 보관함에 추가하지 않음
        if ("기부".equals(pname) || "기부".equals(brand)) {
            log.info("기부 상품은 보관함에 추가하지 않습니다. memberEmail: {}, pname: {}, brand: {}", 
                    memberEmail, pname, brand);
            return null;
        }
        
        // 보관함에 추가
        Collection collection = Collection.builder()
                .memberEmail(memberEmail)
                .pno(pno)
                .pname(pname)
                .price(price)
                .pdesc(pdesc)
                .brand(brand)
                .uploadFileNames(uploadFileNames)
                .source(source)
                .build();

        Collection savedCollection = collectionRepository.save(collection);
        log.info("보관함에 상품 추가 완료. memberEmail: {}, pno: {}, pname: {}", 
                memberEmail, pno, pname);
        
        return savedCollection;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Collection> getCollectionByEmail(String memberEmail) {
        List<Collection> collections = collectionRepository.findByMemberEmailOrderByAddedAtDesc(memberEmail);
        log.info("보관함 조회 완료. memberEmail: {}, 개수: {}", memberEmail, collections.size());
        return collections;
    }

    @Override
    public void removeFromCollection(String memberEmail, Long pno) {
        collectionRepository.deleteByMemberEmailAndPno(memberEmail, pno);
        log.info("보관함에서 상품 삭제 완료. memberEmail: {}, pno: {}", memberEmail, pno);
    }

    @Override
    @Transactional(readOnly = true)
    public long getCollectionCount(String memberEmail) {
        long count = collectionRepository.countByMemberEmail(memberEmail);
        log.info("보관함 개수 조회. memberEmail: {}, count: {}", memberEmail, count);
        return count;
    }
} 