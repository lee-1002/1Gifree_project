package com.gifree.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.gifree.dto.PageRequestDTO;
import com.gifree.dto.PageResponseDTO;
import com.gifree.dto.ProductDTO;
import com.gifree.service.ProductService;
import com.gifree.util.CustomFileUtil;
import com.gifree.dto.StoreDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/products")
public class ProductController {

    private final CustomFileUtil fileUtil;
    private final ProductService productService;

    /** 상품 등록 */
    @PostMapping
    public Map<String, Long> register(@ModelAttribute ProductDTO productDTO) {
        log.info("REGISTER DTO: " + productDTO);

        List<MultipartFile> files = productDTO.getFiles();
        List<String> uploadFileNames = fileUtil.saveFiles(files);
        productDTO.setUploadFileNames(uploadFileNames);

        Long pno = productService.register(productDTO);

        return Map.of("result", pno);
    }

    /** 상품 단건 조회 */
    @GetMapping("/{pno}")
    public ProductDTO read(@PathVariable Long pno) {
        return productService.get(pno);
    }

    /** 상품 수정 */
    @PutMapping("/{pno}")
    public Map<String, String> modify(@PathVariable Long pno, @ModelAttribute ProductDTO productDTO) {
        productDTO.setPno(pno);

        ProductDTO oldProductDTO = productService.get(pno);
        List<String> oldFileNames = oldProductDTO.getUploadFileNames();

        List<MultipartFile> files = productDTO.getFiles();
        List<String> currentUploadFileNames = fileUtil.saveFiles(files);

        List<String> uploadedFileNames = productDTO.getUploadFileNames();
        if (currentUploadFileNames != null && !currentUploadFileNames.isEmpty()) {
            uploadedFileNames.addAll(currentUploadFileNames);
        }

        productService.modify(productDTO);

        if (oldFileNames != null && !oldFileNames.isEmpty()) {
            List<String> removeFiles = oldFileNames.stream()
                    .filter(fileName -> !uploadedFileNames.contains(fileName))
                    .collect(Collectors.toList());
            fileUtil.deleteFiles(removeFiles);
        }

        return Map.of("RESULT", "SUCCESS");
    }

    /** 상품 삭제 */
    @DeleteMapping("/{pno}")
    public Map<String, String> remove(@PathVariable Long pno) {
        List<String> oldFileNames = productService.get(pno).getUploadFileNames();
        productService.remove(pno);
        fileUtil.deleteFiles(oldFileNames);
        return Map.of("RESULT", "SUCCESS");
    }

    /** 이미지 뷰 */
    @GetMapping("/view/{fileName}")
    public ResponseEntity<Resource> viewFileGET(@PathVariable String fileName) {
        return fileUtil.getFile(fileName);
    }

    /** 상품 리스트 (페이징) */
    @GetMapping("/list")
    public PageResponseDTO<ProductDTO> list(PageRequestDTO pageRequestDTO) {
        log.info("list----------------------" + pageRequestDTO);
        return productService.getList(pageRequestDTO);
    }

    @GetMapping("/location-based")
    public ResponseEntity<PageResponseDTO<ProductDTO>> getLocationBasedProducts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String sortBy) {
        
        PageRequestDTO pageRequestDTO = PageRequestDTO.builder()
                .page(page)
                .size(size)
                .build();
        
        PageResponseDTO<ProductDTO> response = productService.getLocationBasedProducts(
                pageRequestDTO, latitude, longitude, brand, sortBy);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/nearby-stores")
    public ResponseEntity<List<StoreDTO>> getNearbyStores(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "5.0") Double radiusKm) {
        
        List<StoreDTO> stores = productService.getNearbyStores(latitude, longitude, radiusKm);
        return ResponseEntity.ok(stores);
    }

}
