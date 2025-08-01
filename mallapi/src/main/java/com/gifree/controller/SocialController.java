package com.gifree.controller;

import org.springframework.web.bind.annotation.RestController;
import com.gifree.dto.MemberDTO;
import com.gifree.dto.MemberModifyDTO;
import com.gifree.service.MemberService;
import com.gifree.util.JWTUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@Log4j2
@RequiredArgsConstructor
public class SocialController {
    
    private final MemberService memberService;

    /**
     * 프론트에서 전달받은 카카오 AccessToken으로
     * 회원정보 조회 → JWT 발급 → 리턴
     */
    @GetMapping("/api/member/kakao")
    public Map<String, Object> getMemberFromKakao(String accessToken) {
        log.info("accessToken: {}", accessToken);
        MemberDTO memberDTO = memberService.getKakaoMember(accessToken);
        Map<String,Object> claims = memberDTO.getClaims();

        // JWT 토큰 생성
        String jwtAccessToken  = JWTUtil.generateToken(claims, 60);    // 10분
        String jwtRefreshToken = JWTUtil.generateToken(claims, 60 * 24 * 14); // 1시간

        claims.put("accessToken", jwtAccessToken);
        claims.put("refreshToken", jwtRefreshToken);
        return claims;
    }

    @PutMapping("/api/member/modify")
    public Map<String,String> modify(@RequestBody MemberModifyDTO dto) {
        log.info("member modify: {}", dto);
        memberService.modifyMember(dto);
        return Map.of("result","modified");
    }
}
