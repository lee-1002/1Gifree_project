package com.gifree.controller;

import com.gifree.domain.Event;
import com.gifree.dto.EventDTO;
import com.gifree.dto.PageRequestDTO;
import com.gifree.dto.PageResponseDTO;
import com.gifree.service.EventService;
import com.gifree.util.CustomFileUtil;

import lombok.extern.log4j.Log4j2;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
@Log4j2
@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;
    private final CustomFileUtil customFileUtil;

    public EventController(EventService eventService, CustomFileUtil customFileUtil) {
        this.eventService = eventService;
        this.customFileUtil = customFileUtil; 
    }

  @GetMapping
public ResponseEntity<PageResponseDTO<Event>> getEventList(PageRequestDTO requestDTO) {
    List<Event> list = eventService.getList(requestDTO);
    long total = eventService.getTotalCount();

    PageResponseDTO<Event> response = PageResponseDTO.<Event>withAll()
            .dtoList(list)
            .pageRequestDTO(requestDTO)
            .totalCount(total)
            .build();

    return ResponseEntity.ok(response);
}

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        log.info("단일 이벤트 조회 요청: id = {}", id);
        var eventOpt = eventService.getEventById(id);
        if(eventOpt.isEmpty()) {
            log.warn("이벤트를 찾을 수 없습니다. id = {}", id);
            return ResponseEntity.notFound().build();
        }
        log.info("이벤트 조회 성공: id = {}", id);
        return ResponseEntity.ok(eventOpt.get());
    }


      @PostMapping
    public ResponseEntity<Event> createEvent(
        // ⭐ 핵심 변경: @RequestPart("event") EventDTO eventDTO 대신 @ModelAttribute EventDTO eventDTO 사용
        @ModelAttribute EventDTO eventDTO, // FormData의 개별 필드를 EventDTO에 자동으로 매핑합니다.
        @RequestPart(value = "image_file", required = false) MultipartFile imageFile
    ) {
        System.out.println("=== 컨트롤러 진입 (FormData - @ModelAttribute 처리) ===");
        System.out.println("받은 DTO (ModelAttribute): " + eventDTO); // 이 시점에서 DTO 필드가 채워져 있어야 합니다.
        System.out.println("이미지 파일: " + (imageFile != null ? imageFile.getOriginalFilename() : "없음"));

        try {
            // 이 시점의 eventDTO에는 프론트에서 보낸 title, description, image_url 등이 모두 채워져 있습니다.
            // image_url 필드는 프론트에서 직접 문자열로 보내고 있으므로, 파일 업로드를 하지 않았다면 이 값을 사용합니다.
            String finalImageUrl = null;
            if (imageFile != null && !imageFile.isEmpty()) {
                // 새로운 이미지 파일이 업로드된 경우
                List<String> savedFiles = customFileUtil.saveFiles(List.of(imageFile));
                finalImageUrl = savedFiles.get(0); // 파일 접근 URL 구성
                log.info("새 이미지 파일 저장 완료, URL: {}", finalImageUrl);
            } else if (eventDTO.getImage_url() != null && !eventDTO.getImage_url().isEmpty()) {
                // 이미지 파일이 없고, 기존 image_url이 DTO에 있는 경우
                finalImageUrl = eventDTO.getImage_url();
                log.info("DTO에 기존 이미지 URL 존재: {}", finalImageUrl);
            } else {
                // 이미지 파일도 없고, DTO에도 image_url이 없는 경우 (예: 초기 등록 시)
                log.info("이미지 파일 또는 기존 이미지 URL이 제공되지 않았습니다.");
            }

            Event event = convertToEntity(eventDTO);
            event.setImageUrl(finalImageUrl); // 최종 결정된 이미지 URL을 엔티티에 설정

            Event saved = eventService.createEvent(event);
            log.info("이벤트 저장 성공: ID = {}", saved.getId());

            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            log.error("이벤트 생성 중 오류 발생", e); // 상세 스택 트레이스를 로깅
            return ResponseEntity.status(500).build();
        }
    }


    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(
        @PathVariable Long id,
     @RequestPart("event") EventDTO eventDTO, 
     @RequestPart(value = "image_file", required = false)  MultipartFile imageFile)
     {
        String imageUrl = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            List<String> savedFiles = customFileUtil.saveFiles(List.of(imageFile));
            imageUrl = savedFiles.get(0);
        } else if (eventDTO.getImage_url() != null) {
            imageUrl = eventDTO.getImage_url();
        }
        Event updatedEvent = convertToEntity(eventDTO);
        updatedEvent.setId(id);
        updatedEvent.setImageUrl(imageUrl);
        return ResponseEntity.ok(eventService.updateEvent(id, updatedEvent));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Event> toggleEventStatus(@PathVariable Long id) {
        return eventService.getEventById(id)
                .map(event -> {
                    event.setActive(!event.isActive());
                    return ResponseEntity.ok(eventService.updateEvent(id, event));
                })
                .orElse(ResponseEntity.notFound().build());
    }



    

    // DTO → Entity 변환 메서드
    private Event convertToEntity(EventDTO eventDTO) {
        return Event.builder()
                .title(eventDTO.getTitle())
                .description(eventDTO.getDescription())
                .imageUrl(eventDTO.getImage_url())
                .startDate(parseDateTime(eventDTO.getStart_date()))
                .endDate(parseDateTime(eventDTO.getEnd_date()))
                .storeName(eventDTO.getStore_name())           // 추가
                .storeAddress(eventDTO.getStore_address()) 
                .isActive(eventDTO.getIsActive())
                .build();
    }

    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isEmpty()) return null;
        return LocalDateTime.parse(dateTimeStr.replace(" ", "T"));
    }
}