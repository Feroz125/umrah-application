package com.almuhammad.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MobileOtpService {
  private final SecureRandom random = new SecureRandom();
  private final Map<String, OtpRecord> otpStore = new ConcurrentHashMap<>();
  private final Map<String, VerificationRecord> verificationStore = new ConcurrentHashMap<>();
  private final long expiresMinutes;
  private final boolean exposeOtpInResponse;

  public MobileOtpService(
      @Value("${security.otp.expiresMinutes:5}") long expiresMinutes,
      @Value("${security.otp.exposeInResponse:true}") boolean exposeOtpInResponse
  ) {
    this.expiresMinutes = expiresMinutes;
    this.exposeOtpInResponse = exposeOtpInResponse;
  }

  public OtpRequestResult generateOtp(String tenantId, String mobileNumber) {
    String otp = String.format("%06d", random.nextInt(1_000_000));
    Instant expiresAt = Instant.now().plusSeconds(expiresMinutes * 60);
    String key = key(tenantId, mobileNumber);
    otpStore.put(key, new OtpRecord(otp, expiresAt));
    verificationStore.remove(key);
    return new OtpRequestResult(expiresAt, exposeOtpInResponse ? otp : null);
  }

  public String verifyOtp(String tenantId, String mobileNumber, String otp) {
    String key = key(tenantId, mobileNumber);
    OtpRecord record = otpStore.get(key);
    if (record == null || Instant.now().isAfter(record.expiresAt())) {
      otpStore.remove(key);
      throw new IllegalArgumentException("OTP expired. Request a new OTP.");
    }
    if (!record.otp().equals(otp)) {
      throw new IllegalArgumentException("Invalid OTP.");
    }
    String verificationToken = UUID.randomUUID().toString();
    verificationStore.put(key, new VerificationRecord(verificationToken, record.expiresAt()));
    return verificationToken;
  }

  public void assertVerified(String tenantId, String mobileNumber, String verificationToken) {
    String key = key(tenantId, mobileNumber);
    VerificationRecord record = verificationStore.get(key);
    if (record == null || Instant.now().isAfter(record.expiresAt())) {
      verificationStore.remove(key);
      throw new IllegalArgumentException("Mobile verification expired. Verify OTP again.");
    }
    if (!record.token().equals(verificationToken)) {
      throw new IllegalArgumentException("Invalid mobile verification token.");
    }
  }

  public void clearVerification(String tenantId, String mobileNumber) {
    String key = key(tenantId, mobileNumber);
    otpStore.remove(key);
    verificationStore.remove(key);
  }

  private String key(String tenantId, String mobileNumber) {
    return tenantId + "|" + mobileNumber;
  }

  public record OtpRequestResult(Instant expiresAt, String otpForDemo) {}
  private record OtpRecord(String otp, Instant expiresAt) {}
  private record VerificationRecord(String token, Instant expiresAt) {}
}
