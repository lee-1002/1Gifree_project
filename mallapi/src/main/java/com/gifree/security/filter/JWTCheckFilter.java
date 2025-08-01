package com.gifree.security.filter;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.google.gson.Gson;
import com.gifree.dto.MemberDTO;
import com.gifree.util.JWTUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;

@Log4j2
public class JWTCheckFilter extends OncePerRequestFilter {

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
    String path = request.getRequestURI();

    log.info("check uri.......................{}", path);

    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
    if (path.startsWith("/api/products/view/")) return true;
    if (path.startsWith("/api/events/")) return true;
    if (path.startsWith("/api/products/")) return true; 
    if (path.startsWith("/api/events/")) return true; 
    if (path.startsWith("/api/donationBoard/list")) return true;
    if (path.startsWith("/api/donationBoard/recent")) return true;
    if (path.startsWith("/api/donationBoard/category")) return true;
    if (path.startsWith("/api/donationBoard/") && path.matches("/api/donationBoard/\\d+")) return true;
    if ("/api/member/signup".equals(path)) return true; 
    if ("/api/member/login".equals(path)) return true;
    if ("/api/order".equals(path)) return true;
    if ("/api/bootpay".equals(path)) return true;

    return false;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    log.info("------------------------JWTCheckFilter------------------");

    String authHeaderStr = request.getHeader("Authorization");

    // ✅ 헤더가 없거나 잘못된 경우 그냥 통과 (로그인 안 된 사용자)
    if (authHeaderStr == null || !authHeaderStr.startsWith("Bearer ")) {
      log.warn("Authorization header missing or invalid");
      filterChain.doFilter(request, response);
      return;
    }

    try {
      // Bearer 토큰 추출
      String accessToken = authHeaderStr.substring(7);
      Map<String, Object> claims = JWTUtil.validateToken(accessToken);

      log.info("JWT claims: {}", claims);

      String email = (String) claims.get("email");
      String pw = (String) claims.get("pw");
      String nickname = (String) claims.get("nickname");
      Boolean social = (Boolean) claims.get("social");
      List<String> roleNames = (List<String>) claims.get("roleNames");

      MemberDTO memberDTO = new MemberDTO(email, pw, nickname, social, roleNames);

      log.info("Authenticated member: {}", memberDTO);

      UsernamePasswordAuthenticationToken authenticationToken =
          new UsernamePasswordAuthenticationToken(memberDTO, pw, memberDTO.getAuthorities());

      SecurityContextHolder.getContext().setAuthentication(authenticationToken);

      filterChain.doFilter(request, response);

    } catch (Exception e) {
      log.error("JWT Check Error: {}", e.getMessage());

      Gson gson = new Gson();
      String msg = gson.toJson(Map.of("error", "ERROR_ACCESS_TOKEN"));

      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.setContentType("application/json");
      PrintWriter printWriter = response.getWriter();
      printWriter.println(msg);
      printWriter.close();
    }
  }
}
