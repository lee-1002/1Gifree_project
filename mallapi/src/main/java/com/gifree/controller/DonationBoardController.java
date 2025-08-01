package com.gifree.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gifree.dto.PageRequestDTO;
import com.gifree.dto.PageResponseDTO;
import com.gifree.dto.DonationBoardDTO;
import com.gifree.service.DonationBoardService;
import com.gifree.domain.DonationCategory;
import org.springframework.security.access.prepost.PreAuthorize;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;



@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/donationBoard")
public class DonationBoardController {

    private final DonationBoardService service;

    @GetMapping("/recent")
    public List<DonationBoardDTO> getRecentList() {
        log.info("Fetching recent donation board posts");
        PageRequestDTO pageRequestDTO = PageRequestDTO.builder().page(1).size(5).build();
        PageResponseDTO<DonationBoardDTO> pageResponseDTO = service.list(pageRequestDTO);
        return pageResponseDTO.getDtoList();
    }

    @GetMapping("/{tno}")
  public DonationBoardDTO get(@PathVariable(name ="tno") Long tno) {

    return service.get(tno);
  }

  // 카테고리별 조회 API - 더 구체적인 경로를 먼저 배치
  @GetMapping("/category")
  public PageResponseDTO<DonationBoardDTO> listByCategory(
      PageRequestDTO pageRequestDTO,
      @RequestParam("category") String categoryStr) {
    
    log.info("Category filter: " + categoryStr);
    
    try {
      DonationCategory category = DonationCategory.valueOf(categoryStr);
      return service.listByCategory(pageRequestDTO, category);
    } catch (IllegalArgumentException e) {
      log.error("Invalid category: " + categoryStr);
      // 잘못된 카테고리인 경우 전체 목록 반환
      return service.list(pageRequestDTO);
    }
  }

  @GetMapping("/list")
  public PageResponseDTO<DonationBoardDTO> list(PageRequestDTO pageRequestDTO ) {

    log.info(pageRequestDTO);

    return service.list(pageRequestDTO);
  }

  @PostMapping("/")
    public Map<String, Long> register(@RequestBody DonationBoardDTO donationBoardDTO) {
        log.info("Register DTO: " + donationBoardDTO); // content가 잘 들어오는지 확인
        Long tno = service.register(donationBoardDTO);
        return Map.of("TNO", tno);
    }


      @PutMapping("/{tno}")
  public Map<String, String> modify(
            @PathVariable("tno") Long tno,
            @RequestBody DonationBoardDTO donationBoardDTO) {
        donationBoardDTO.setTno(tno);
        service.modify(donationBoardDTO);
        // 파일 수정은 위 registerImageFiles API를 프론트에서 동일하게 호출하여 처리합니다.
        return Map.of("RESULT", "SUCCESS");
    }
    
      @DeleteMapping("/{tno}")
  public Map<String, String> remove( @PathVariable(name="tno") Long tno ){

    log.info("Remove:  " + tno);

    service.remove(tno);

    return Map.of("RESULT", "SUCCESS");
  }

  @PostMapping("/{tno}/files")
    public void registerImageFiles(@PathVariable("tno") Long tno, @RequestBody List<String> fileNames) {
        log.info("Register files for tno: " + tno + ", files: " + fileNames);
        service.addImageFiles(tno, fileNames);
    }

}