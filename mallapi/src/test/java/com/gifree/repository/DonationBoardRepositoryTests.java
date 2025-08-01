package com.gifree.repository;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.gifree.domain.DonationBoard;

import lombok.extern.log4j.Log4j2;

@SpringBootTest
@Log4j2
public class DonationBoardRepositoryTests {  

    @Autowired
    private DonationBoardRepository donationBoardRepository;
    
    @Test
  public void testInsert() {

    for (int i = 1; i <= 100; i++) {

      DonationBoard donationBoard = DonationBoard.builder()
      .title("Title..." + i)
      .dueDate(LocalDate.of(2025,06,23))
      .writer("user00")
      .build();

      donationBoardRepository.save(donationBoard);
    }
  }
    @Test
  public void testRead() {

    //존재하는 번호로 확인 
    Long tno = 33L;

    java.util.Optional<DonationBoard> result = donationBoardRepository.findById(tno);

    DonationBoard donationBoard = result.orElseThrow();

    log.info(donationBoard);
  }

    @Test
  public void testModify() {

    Long tno = 100L;

    java.util.Optional<DonationBoard> result = donationBoardRepository.findById(tno); //java.util 패키지의 Optional

    DonationBoard donationBoard = result.orElseThrow();
    donationBoard.changeTitle("Modified 100...");
    donationBoard.changeComplete(true);
    donationBoard.changeDueDate(LocalDate.of(2025,06,23));

    donationBoardRepository.save(donationBoard);

  }
    @Test
  public void testDelete() {
    Long tno = 1L;

    donationBoardRepository.deleteById(tno);

  }

      @Test
  public void testPaging() {

    //import org.springframework.data.domain.Pageable;

    Pageable pageable = PageRequest.of(0,10, Sort.by("tno").descending());

    Page<DonationBoard> result = donationBoardRepository.findAll(pageable);

    log.info(result.getTotalElements());

    result.getContent().stream().forEach(donationBoard -> log.info(donationBoard));

  }
    
}