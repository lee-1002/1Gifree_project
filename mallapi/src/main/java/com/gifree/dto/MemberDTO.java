package com.gifree.dto;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class MemberDTO extends User {

  private String email;
    
  private String pw;

  private String nickname;

  private boolean social;

  private List<String> roleNames = new ArrayList<>();

  public MemberDTO(String email, String pw, String nickname, boolean social, List<String> roleNames) {
    super(
      email,
      pw, 
      roleNames.stream().map(str -> new SimpleGrantedAuthority("ROLE_"+str)).collect(Collectors.toList()));
    
    this.email = email;
    this.pw = pw;
    this.nickname = nickname;
    this.social = social;
    this.roleNames = roleNames;
  }

  // jwt 문자열 생성시 사용하기 위함.
  public Map<String, Object> getClaims() {

    Map<String, Object> dataMap = new HashMap<>();

    dataMap.put("email", email);
    dataMap.put("pw",pw);
    dataMap.put("nickname", nickname);
    dataMap.put("social", social);
    // JWT 토큰에는 ROLE_ 접두사가 붙은 권한을 저장 (Spring Security용)
    List<String> normalizedRoles = roleNames.stream()
        .map(role -> "ROLE_" + role)
        .collect(Collectors.toList());
    dataMap.put("roleNames", normalizedRoles);

    return dataMap;
  }

}