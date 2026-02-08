package com.almuhammad.auth.api;

import com.almuhammad.auth.domain.User;
import com.almuhammad.auth.service.AuthService;
import com.almuhammad.auth.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final AuthService authService;
  private final JwtService jwtService;

  public AuthController(AuthService authService, JwtService jwtService) {
    this.authService = authService;
    this.jwtService = jwtService;
  }

  public record LoginRequest(String email, String password) {}
  public record RegisterRequest(String email, String password) {}

  @PostMapping("/login")
  public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest payload) {
    User user = authService.authenticate(payload.email(), payload.password());
    String token = jwtService.generate(user.getEmail(), user.getRole());
    return ResponseEntity.ok(Map.of(
      "token", token,
      "user", user.getEmail(),
      "role", user.getRole()
    ));
  }

  @PostMapping("/register")
  public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest payload) {
    User user = authService.register(payload.email(), payload.password(), "USER");
    String token = jwtService.generate(user.getEmail(), user.getRole());
    return ResponseEntity.ok(Map.of(
      "token", token,
      "user", user.getEmail(),
      "role", user.getRole()
    ));
  }

  @PostMapping("/validate")
  public ResponseEntity<Map<String, Object>> validate(@RequestBody Map<String, String> payload) {
    Map<String, Object> claims = jwtService.parse(payload.getOrDefault("token", ""));
    return ResponseEntity.ok(claims);
  }
}
