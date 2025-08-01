package com.gifree.controller;

import com.gifree.util.CustomFileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Log4j2
public class FileController {

    private final CustomFileUtil customFileUtil;

    // 여러 파일 업로드 처리
    @PostMapping("/upload")
    public List<String> uploadFiles(@RequestParam("files") List<MultipartFile> files) {
        return customFileUtil.saveFiles(files);
    }

    // 파일 다운로드
    @GetMapping("/{filename}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        return customFileUtil.getFile(filename);
    }

    // 파일 삭제 (삭제할 파일명 리스트를 JSON 배열로 받음)
    @DeleteMapping
    public void deleteFiles(@RequestBody List<String> fileNames) {
        customFileUtil.deleteFiles(fileNames);
    }
}
