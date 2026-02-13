package com.almuhammad.auth.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
  private final String secret;
  private final String issuer;
  private final long expiresMinutes;

  public JwtService(
      @Value("${security.jwt.secret}") String secret,
      @Value("${security.jwt.issuer}") String issuer,
      @Value("${security.jwt.expiresMinutes}") long expiresMinutes
  ) {
    this.secret = secret;
    this.issuer = issuer;
    this.expiresMinutes = expiresMinutes;
  }

  public String generate(String email, String role, String tenantId) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(expiresMinutes * 60);

    return Jwts.builder()
      .subject(email)
      .issuer(issuer)
      .issuedAt(Date.from(now))
      .expiration(Date.from(exp))
      .claims(Map.of("role", role, "tenant", tenantId))
      .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
      .compact();
  }

  public Map<String, Object> parse(String token) {
    return Jwts.parser()
      .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
      .build()
      .parseSignedClaims(token)
      .getPayload();
  }
}
