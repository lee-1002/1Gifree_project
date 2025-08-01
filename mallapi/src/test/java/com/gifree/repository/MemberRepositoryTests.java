package com.gifree.repository;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.gifree.domain.Member;
import com.gifree.domain.MemberRole;

@SpringBootTest
@Log4j2
public class MemberRepositoryTests {

  @Autowired
  private MemberRepository memberRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Test
  public void testInsertMember(){

    for (int i = 0; i < 10 ; i++) {

      Member member = Member.builder()
              .email("user"+i+"@aaa.com")
              .pw(passwordEncoder.encode("1111"))
              .nickname("USER"+i)
              .build();

      member.addRole(MemberRole.USER);

      
      if(i >=8){
          member.addRole(MemberRole.ADMIN);
      }
      memberRepository.save(member);
    }
  }

  @Test
  public void testRead() {

    String email = "user9@aaa.com";

    Member member = memberRepository.getWithRoles(email);

    log.info("-----------------");
    log.info(member);
  }


  
  @Test
  public void testPasswordMatch() {
      String email = "user6@aaa.com";
      String rawPw = "1111";
  
      Member member = memberRepository.findById(email).orElseThrow();
  
      System.out.println("✅ 비밀번호 DB 저장값: " + member.getPw());
      System.out.println("✅ 평문과 매치 여부: " + passwordEncoder.matches(rawPw, member.getPw()));
  }

  @Test
  public void insertFixedPasswordUser() {
    String rawPw = "1111";
    String encodedPw = passwordEncoder.encode(rawPw);
  
    System.out.println("🧪 인코딩된 비밀번호: " + encodedPw);
  
    Member member = Member.builder()
        .email("user10@aaa.com")
        .pw(encodedPw)
        .nickname("USER10")
        .social(false)
        .build();
  
    member.addRole(MemberRole.USER);
  
    memberRepository.save(member);
  }


}