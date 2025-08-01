package com.gifree.service;

import com.gifree.dto.BoardDTO;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface BoardService {
    List<BoardDTO> list();
    List<BoardDTO> listWithMembers();
    BoardDTO get(Long bno);
    Long register(BoardDTO dto, List<MultipartFile> files) throws Exception;
    void modify(Long bno, BoardDTO dto, List<MultipartFile> files) throws Exception;
    void remove(Long bno);
    void addDummyData();
}