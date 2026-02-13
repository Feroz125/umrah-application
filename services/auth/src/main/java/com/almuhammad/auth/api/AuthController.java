package com.almuhammad.auth.api;

import com.almuhammad.auth.domain.User;
import com.almuhammad.auth.service.AuthService;
import com.almuhammad.auth.service.GoogleTokenVerifier;
import com.almuhammad.auth.service.JwtService;
import com.almuhammad.auth.service.MobileOtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final AuthService authService;
  private final JwtService jwtService;
  private final GoogleTokenVerifier googleTokenVerifier;
  private final MobileOtpService mobileOtpService;

  public AuthController(
      AuthService authService,
      JwtService jwtService,
      GoogleTokenVerifier googleTokenVerifier,
      MobileOtpService mobileOtpService
  ) {
    this.authService = authService;
    this.jwtService = jwtService;
    this.googleTokenVerifier = googleTokenVerifier;
    this.mobileOtpService = mobileOtpService;
  }

  public record LoginRequest(String email, String password) {}
  public record RegisterRequest(
      String firstName,
      String lastName,
      String email,
      String mobileNumber,
      String mobileVerificationToken,
      String password
  ) {}
  public record GoogleLoginRequest(String idToken) {}
  public record OtpRequest(String mobileNumber) {}
  public record OtpVerifyRequest(String mobileNumber, String otp) {}

  @PostMapping("/login")
  public ResponseEntity<Map<String, Object>> login(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
      @RequestBody LoginRequest payload
  ) {
    try {
      String tenantId = normalizeTenant(tenantHeader);
      User user = authService.authenticate(tenantId, payload.email(), payload.password());
      String token = jwtService.generate(user.getEmail(), user.getRole(), user.getTenantId());
      return ResponseEntity.ok(Map.of(
        "token", token,
        "user", user.getEmail(),
        "role", user.getRole(),
        "tenantId", user.getTenantId(),
        "firstName", user.getFirstName() == null ? "" : user.getFirstName(),
        "lastName", user.getLastName() == null ? "" : user.getLastName(),
        "mobileNumber", user.getMobileNumber() == null ? "" : user.getMobileNumber()
      ));
    } catch (IllegalArgumentException ex) {
      return ResponseEntity.status(401).body(Map.of("error", ex.getMessage()));
    }
  }

  @PostMapping("/register")
  public ResponseEntity<Map<String, Object>> register(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
      @RequestBody RegisterRequest payload
  ) {
    try {
      String tenantId = normalizeTenant(tenantHeader);
      User user = authService.register(
        tenantId,
        payload.email(),
        payload.password(),
        "USER",
        payload.firstName(),
        payload.lastName(),
        payload.mobileNumber(),
        payload.mobileVerificationToken()
      );
      String token = jwtService.generate(user.getEmail(), user.getRole(), user.getTenantId());
      return ResponseEntity.ok(Map.of(
        "token", token,
        "user", user.getEmail(),
        "role", user.getRole(),
        "tenantId", user.getTenantId(),
        "firstName", user.getFirstName(),
        "lastName", user.getLastName(),
        "mobileNumber", user.getMobileNumber()
      ));
    } catch (IllegalArgumentException ex) {
      return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
  }

  @PostMapping("/otp/request")
  public ResponseEntity<Map<String, Object>> requestOtp(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
      @RequestBody OtpRequest payload
  ) {
    try {
      String tenantId = normalizeTenant(tenantHeader);
      String mobile = normalizeMobile(payload.mobileNumber());
      MobileOtpService.OtpRequestResult result = mobileOtpService.generateOtp(tenantId, mobile);
      Map<String, Object> response = new HashMap<>();
      response.put("message", "OTP sent");
      response.put("expiresAt", result.expiresAt());
      if (result.otpForDemo() != null) {
        response.put("demoOtp", result.otpForDemo());
      }
      return ResponseEntity.ok(response);
    } catch (IllegalArgumentException ex) {
      return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
  }

  @PostMapping("/otp/verify")
  public ResponseEntity<Map<String, Object>> verifyOtp(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
      @RequestBody OtpVerifyRequest payload
  ) {
    try {
      String tenantId = normalizeTenant(tenantHeader);
      String mobile = normalizeMobile(payload.mobileNumber());
      String verificationToken = mobileOtpService.verifyOtp(tenantId, mobile, payload.otp());
      return ResponseEntity.ok(Map.of(
        "message", "OTP verified",
        "mobileVerificationToken", verificationToken
      ));
    } catch (IllegalArgumentException ex) {
      return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
  }

  @PostMapping("/google")
  public ResponseEntity<Map<String, Object>> google(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
      @RequestBody GoogleLoginRequest payload
  ) {
    try {
      String tenantId = normalizeTenant(tenantHeader);
      String email = googleTokenVerifier.verifyAndExtractEmail(payload.idToken());
      User user = authService.registerOrGetGoogleUser(tenantId, email);
      String token = jwtService.generate(user.getEmail(), user.getRole(), user.getTenantId());
      return ResponseEntity.ok(Map.of(
        "token", token,
        "user", user.getEmail(),
        "role", user.getRole(),
        "tenantId", user.getTenantId(),
        "firstName", user.getFirstName() == null ? "" : user.getFirstName(),
        "lastName", user.getLastName() == null ? "" : user.getLastName(),
        "mobileNumber", user.getMobileNumber() == null ? "" : user.getMobileNumber()
      ));
    } catch (IllegalArgumentException ex) {
      return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
  }

  @GetMapping("/me")
  public ResponseEntity<Map<String, Object>> me(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
      @RequestHeader(value = "Authorization", required = false) String authorization
  ) {
    try {
      if (authorization == null || !authorization.startsWith("Bearer ")) {
        return ResponseEntity.status(401).body(Map.of("error", "Missing bearer token"));
      }
      String tenantId = normalizeTenant(tenantHeader);
      Map<String, Object> claims = jwtService.parse(authorization.substring(7));
      String email = String.valueOf(claims.getOrDefault("sub", ""));
      String tokenTenant = String.valueOf(claims.getOrDefault("tenant", tenantId));
      if (!tenantId.equals(tokenTenant)) {
        return ResponseEntity.status(403).body(Map.of("error", "Tenant mismatch"));
      }
      User user = authService.getProfile(tenantId, email);
      return ResponseEntity.ok(Map.of(
        "user", user.getEmail(),
        "role", user.getRole(),
        "tenantId", user.getTenantId(),
        "firstName", user.getFirstName() == null ? "" : user.getFirstName(),
        "lastName", user.getLastName() == null ? "" : user.getLastName(),
        "mobileNumber", user.getMobileNumber() == null ? "" : user.getMobileNumber()
      ));
    } catch (IllegalArgumentException ex) {
      return ResponseEntity.status(401).body(Map.of("error", ex.getMessage()));
    }
  }

  @PostMapping("/validate")
  public ResponseEntity<Map<String, Object>> validate(@RequestBody Map<String, String> payload) {
    Map<String, Object> claims = jwtService.parse(payload.getOrDefault("token", ""));
    return ResponseEntity.ok(claims);
  }

  private String normalizeMobile(String mobile) {
    if (mobile == null) {
      throw new IllegalArgumentException("Mobile number is required");
    }
    String value = mobile.replaceAll("\\s+", "");
    if (!value.matches("^\\+[1-9]\\d{6,14}$")) {
      throw new IllegalArgumentException("Mobile number must include country code, e.g. +919876543210");
    }
    return value;
  }

  private String normalizeTenant(String tenantHeader) {
    if (tenantHeader == null || tenantHeader.isBlank()) {
      return "public";
    }
    String normalized = tenantHeader.trim().toLowerCase();
    if (!normalized.matches("^[a-z0-9][a-z0-9_-]{1,39}$")) {
      throw new IllegalArgumentException("Invalid tenant id");
    }
    return normalized;
  }
}
