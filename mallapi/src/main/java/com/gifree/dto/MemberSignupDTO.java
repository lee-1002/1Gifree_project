package com.gifree.dto;

import lombok.Data;

@Data
public class MemberSignupDTO {
    private String email;
    private String pw;
    private String nickname;
}