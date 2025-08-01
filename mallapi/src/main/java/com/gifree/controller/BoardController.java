// src/main/java/com/gifree/controller/BoardController.java
package com.gifree.controller;

import com.gifree.dto.BoardDTO;
import com.gifree.service.BoardService;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/boards")
public class BoardController {

    private final BoardService svc;
    

    @GetMapping
    public List<BoardDTO> list() {
        return svc.list();
    }

    @GetMapping("/with-members")
    public List<BoardDTO> listWithMembers() {
        return svc.listWithMembers();
    }

    @GetMapping("/{bno}")
    public BoardDTO read(@PathVariable Long bno) {
        return svc.get(bno);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Long> register(
        @ModelAttribute BoardDTO dto,
        @RequestParam(value = "files", required = false) List<MultipartFile> files
    ) throws Exception {
        Long bno = svc.register(dto, files);
        return Map.of("result", bno);
    }

    @PutMapping(value = "/{bno}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public void modify(
        @PathVariable Long bno,
        @ModelAttribute BoardDTO dto,
        @RequestParam(value = "files", required = false) List<MultipartFile> files
    ) throws Exception {
        svc.modify(bno, dto, files);
    }

    @DeleteMapping("/{bno}")
    public void delete(@PathVariable Long bno) {
        svc.remove(bno);
    }

    @PostMapping("/dummy")
    public void addDummyData() {
        svc.addDummyData();
    }

    // @GetMapping("/view/{filename:.+}")
    // public ResponseEntity<Resource> view(@PathVariable String filename) throws Exception {
    //     // subDir="boards"에 저장된 파일을 꺼냅니다
    //     Resource r = fileUtil.loadAsResource("boards", filename);
    //     String ct = Files.probeContentType(r.getFile().toPath());
    //     if (ct == null) ct = MediaType.APPLICATION_OCTET_STREAM_VALUE;
    //     return ResponseEntity
    //         .ok()
    //         .contentType(MediaType.parseMediaType(ct))
    //         .body(r);
    // }

    
}
