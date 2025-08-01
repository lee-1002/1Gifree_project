package com.gifree.controller;

import com.gifree.domain.Collection;
import com.gifree.service.CollectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collection")
@RequiredArgsConstructor
@Log4j2
public class CollectionController {

    private final CollectionService collectionService;

    // 보관함에 상품 추가
    @PostMapping("/add")
    public ResponseEntity<?> addToCollection(@RequestBody Map<String, Object> request, Principal principal) {
        try {
            String memberEmail = principal.getName();
            
            // 요청 데이터 추출
            Long pno = Long.valueOf(request.get("pno").toString());
            String pname = (String) request.get("pname");
            Integer price = Integer.valueOf(request.get("price").toString());
            String pdesc = (String) request.get("pdesc");
            String brand = (String) request.get("brand");
            
            // uploadFileNames 처리 (배열 또는 문자열)
            String uploadFileNames = null;
            Object uploadFileNamesObj = request.get("uploadFileNames");
            if (uploadFileNamesObj != null) {
                if (uploadFileNamesObj instanceof List) {
                    List<?> fileList = (List<?>) uploadFileNamesObj;
                    if (!fileList.isEmpty()) {
                        uploadFileNames = fileList.get(0).toString(); // 첫 번째 파일명만 사용
                    }
                } else {
                    uploadFileNames = uploadFileNamesObj.toString();
                }
            }
            
            String source = (String) request.get("source");

            // 필수 필드 검증
            if (pno == null || pname == null || price == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "필수 정보가 누락되었습니다."));
            }

            // 보관함에 추가
            Collection addedCollection = collectionService.addToCollection(
                memberEmail, pno, pname, price, pdesc, brand, uploadFileNames, source
            );

            log.info("보관함 추가 성공. memberEmail: {}, pno: {}, pname: {}", 
                    memberEmail, pno, pname);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "보관함에 추가되었습니다.",
                "collection", addedCollection
            ));

        } catch (Exception e) {
            log.error("보관함 추가 중 오류 발생", e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "보관함 추가 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }

    // 보관함 조회
    @GetMapping
    public ResponseEntity<List<Collection>> getCollection(Principal principal) {
        try {
            String memberEmail = principal.getName();
            List<Collection> collections = collectionService.getCollectionByEmail(memberEmail);
            
            log.info("보관함 조회 성공. memberEmail: {}, 개수: {}", memberEmail, collections.size());
            
            return ResponseEntity.ok(collections);
        } catch (Exception e) {
            log.error("보관함 조회 중 오류 발생", e);
            return ResponseEntity.status(500).build();
        }
    }

    // 보관함에서 상품 삭제
    @DeleteMapping("/{pno}")
    public ResponseEntity<?> removeFromCollection(@PathVariable Long pno, Principal principal) {
        try {
            String memberEmail = principal.getName();
            collectionService.removeFromCollection(memberEmail, pno);
            
            log.info("보관함에서 상품 삭제 성공. memberEmail: {}, pno: {}", memberEmail, pno);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "보관함에서 삭제되었습니다."
            ));
        } catch (Exception e) {
            log.error("보관함에서 상품 삭제 중 오류 발생", e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "삭제 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }

    // 보관함 개수 조회
    @GetMapping("/count")
    public ResponseEntity<?> getCollectionCount(Principal principal) {
        try {
            String memberEmail = principal.getName();
            long count = collectionService.getCollectionCount(memberEmail);
            
            return ResponseEntity.ok(Map.of(
                "count", count
            ));
        } catch (Exception e) {
            log.error("보관함 개수 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "개수 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
} 