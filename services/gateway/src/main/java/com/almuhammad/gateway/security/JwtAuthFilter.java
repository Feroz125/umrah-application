package com.almuhammad.gateway.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {
  private final String secret;

  public JwtAuthFilter(@Value("${security.jwt.secret}") String secret) {
    this.secret = secret;
  }

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    String path = exchange.getRequest().getURI().getPath();

    if (exchange.getRequest().getMethod().matches("OPTIONS")) {
      return chain.filter(exchange);
    }

    if (isPublic(path)) {
      return chain.filter(exchange);
    }

    String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
    if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
      exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
      return exchange.getResponse().setComplete();
    }

    String token = authHeader.substring(7);
    try {
      Map<String, Object> claims = Jwts.parser()
        .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
        .build()
        .parseSignedClaims(token)
        .getPayload();

      String role = String.valueOf(claims.get("role"));
      String user = String.valueOf(claims.get("sub"));

      if (path.startsWith("/api/admin") && !"ADMIN".equalsIgnoreCase(role)) {
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        return exchange.getResponse().setComplete();
      }

      ServerHttpRequest mutated = exchange.getRequest().mutate()
        .header("X-User", user)
        .header("X-Role", role)
        .build();

      return chain.filter(exchange.mutate().request(mutated).build());
    } catch (Exception ex) {
      exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
      return exchange.getResponse().setComplete();
    }
  }

  private boolean isPublic(String path) {
    List<String> publicPrefixes = List.of("/api/auth", "/actuator");
    for (String prefix : publicPrefixes) {
      if (path.startsWith(prefix)) {
        return true;
      }
    }
    return path.equals("/api/catalog/packages");
  }

  @Override
  public int getOrder() {
    return -1;
  }
}
