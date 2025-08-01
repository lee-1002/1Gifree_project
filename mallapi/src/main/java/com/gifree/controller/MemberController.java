package com.gifree.controller;

import com.gifree.domain.Member;
import com.gifree.domain.MemberRole;
import com.gifree.dto.MemberSignupDTO;
import com.gifree.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/member")
public class MemberController {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody MemberSignupDTO dto) {

        if (memberRepository.existsById(dto.getEmail())) {
            return ResponseEntity.badRequest().body("이미 존재하는 이메일입니다.");
        }

        Member member = Member.builder()
                .email(dto.getEmail())
                .pw(passwordEncoder.encode(dto.getPw()))
                .nickname(dto.getNickname())
                .social(false)
                .build();

        member.addRole(MemberRole.USER);

        memberRepository.save(member);

        return ResponseEntity.ok("회원가입 성공");
    }
}
