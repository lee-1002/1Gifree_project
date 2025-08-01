package com.gifree.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gifree.domain.DonationBoard;
import com.gifree.dto.PageRequestDTO;
import com.gifree.dto.PageResponseDTO;
import com.gifree.dto.DonationBoardDTO;
import com.gifree.repository.DonationBoardRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import com.gifree.domain.DonationCategory;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class DonationBoardServiceImpl implements DonationBoardService {

  private final ModelMapper modelMapper;
  private final DonationBoardRepository donationBoardRepository;

  @Override
  public Long register(DonationBoardDTO donationBoardDTO) {
      DonationBoard donationBoard = modelMapper.map(donationBoardDTO, DonationBoard.class);
      DonationBoard savedDonationBoard = donationBoardRepository.save(donationBoard);
      return savedDonationBoard.getTno();
  }

  @Override
  public void addImageFiles(Long tno, List<String> fileNames) {
      DonationBoard donationBoard = donationBoardRepository.findById(tno).orElseThrow();
      donationBoard.clearImages();
      if (fileNames != null && !fileNames.isEmpty()) {
          fileNames.forEach(donationBoard::addImage);
      }
      donationBoardRepository.save(donationBoard);
  }

  @Override
  public void modify(DonationBoardDTO donationBoardDTO) {
      DonationBoard donationBoard = donationBoardRepository.findById(donationBoardDTO.getTno()).orElseThrow();
      if (donationBoardDTO.getTitle() != null && !donationBoardDTO.getTitle().isEmpty()) {
          donationBoard.changeTitle(donationBoardDTO.getTitle());
      }
      if (donationBoardDTO.getContent() != null && !donationBoardDTO.getContent().isEmpty()) {
          donationBoard.changeContent(donationBoardDTO.getContent());
      }
      donationBoard.changeComplete(donationBoardDTO.isComplete());
      if (donationBoardDTO.getCategory() != null) {
          donationBoard.changeCategory(donationBoardDTO.getCategory());
      }
      donationBoardRepository.save(donationBoard);
  }

  @Override
  public DonationBoardDTO get(Long tno) {
      DonationBoard donationBoard = donationBoardRepository.findById(tno).orElseThrow();

      DonationBoardDTO dto = modelMapper.map(donationBoard, DonationBoardDTO.class);

      // uploadFileNames 는 List<String> 이므로 바로 세팅
      dto.setUploadFileNames(donationBoard.getUploadFileNames());

      return dto;
  }

  @Override
  public void remove(Long tno) {
      donationBoardRepository.deleteById(tno);
  }

  @Override
  public PageResponseDTO<DonationBoardDTO> list(PageRequestDTO pageRequestDTO) {
      Pageable pageable = PageRequest.of(
          pageRequestDTO.getPage() - 1,
          pageRequestDTO.getSize(),
          Sort.by("tno").descending()
      );

      Page<DonationBoard> result = donationBoardRepository.findAllWithImages(pageable);

      List<DonationBoardDTO> dtoList = result.getContent().stream()
          .map(donationBoard -> {
              DonationBoardDTO dto = modelMapper.map(donationBoard, DonationBoardDTO.class);

              // uploadFileNames 는 List<String> 이므로 바로 세팅
              dto.setUploadFileNames(donationBoard.getUploadFileNames());

              return dto;
          })
          .collect(Collectors.toList());

      long totalCount = result.getTotalElements();

      return PageResponseDTO.<DonationBoardDTO>withAll()
          .dtoList(dtoList)
          .pageRequestDTO(pageRequestDTO)
          .totalCount(totalCount)
          .build();
  }

  @Override
  public PageResponseDTO<DonationBoardDTO> listByCategory(PageRequestDTO pageRequestDTO, DonationCategory category) {
      log.info("카테고리별 조회 시작: {}", category);
      
      Pageable pageable = PageRequest.of(
          pageRequestDTO.getPage() - 1,
          pageRequestDTO.getSize(),
          Sort.by("tno").descending()
      );

      Page<DonationBoard> result = donationBoardRepository.findByCategoryWithImages(category, pageable);
      
      log.info("카테고리별 조회 결과: 총 {}개 항목", result.getTotalElements());

      List<DonationBoardDTO> dtoList = result.getContent().stream()
          .map(donationBoard -> {
              DonationBoardDTO dto = modelMapper.map(donationBoard, DonationBoardDTO.class);

              // uploadFileNames 는 List<String> 이므로 바로 세팅
              dto.setUploadFileNames(donationBoard.getUploadFileNames());

              return dto;
          })
          .collect(Collectors.toList());

      long totalCount = result.getTotalElements();

      return PageResponseDTO.<DonationBoardDTO>withAll()
          .dtoList(dtoList)
          .pageRequestDTO(pageRequestDTO)
          .totalCount(totalCount)
          .build();
  }
}
