package com.almuhammad.auth.service;

import com.almuhammad.auth.domain.User;
import com.almuhammad.auth.repo.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {
  private final UserRepository users;
  private final PasswordEncoder encoder;
  private final MobileOtpService mobileOtpService;

  public AuthService(UserRepository users, PasswordEncoder encoder, MobileOtpService mobileOtpService) {
    this.users = users;
    this.encoder = encoder;
    this.mobileOtpService = mobileOtpService;
  }

  public User register(String email, String password, String role) {
    String localPart = email.contains("@") ? email.substring(0, email.indexOf("@")) : email;
    User user = new User();
    user.setTenantId("public");
    user.setFirstName(localPart);
    user.setLastName("");
    user.setEmail(email);
    user.setMobileNumber(null);
    user.setPasswordHash(encoder.encode(password));
    user.setRole(role);
    return users.save(user);
  }

  public User register(
      String tenantId,
      String email,
      String password,
      String role,
      String firstName,
      String lastName,
      String mobileNumber,
      String mobileVerificationToken
  ) {
    validateRegistrationInput(firstName, lastName, email, password, mobileNumber);
    if (users.findByEmailAndTenantId(email, tenantId).isPresent()) {
      throw new IllegalArgumentException("Email already registered");
    }
    if (users.findByMobileNumberAndTenantId(mobileNumber, tenantId).isPresent()) {
      throw new IllegalArgumentException("Mobile number already registered");
    }
    mobileOtpService.assertVerified(tenantId, mobileNumber, mobileVerificationToken);

    User user = new User();
    user.setTenantId(tenantId);
    user.setFirstName(firstName.trim());
    user.setLastName(lastName.trim());
    user.setEmail(email);
    user.setMobileNumber(mobileNumber);
    user.setPasswordHash(encoder.encode(password));
    user.setRole(role);
    User saved = users.save(user);
    mobileOtpService.clearVerification(tenantId, mobileNumber);
    return saved;
  }

  public User authenticate(String tenantId, String email, String password) {
    User user = users.findByEmailAndTenantId(email, tenantId).orElseThrow();
    if (!encoder.matches(password, user.getPasswordHash())) {
      throw new IllegalArgumentException("Invalid credentials");
    }
    return user;
  }

  public User registerOrGetGoogleUser(String tenantId, String email) {
    return users.findByEmailAndTenantId(email, tenantId).orElseGet(() -> {
      User user = new User();
      String namePart = email.contains("@") ? email.substring(0, email.indexOf("@")) : email;
      user.setTenantId(tenantId);
      user.setFirstName(namePart);
      user.setLastName("");
      user.setEmail(email);
      user.setMobileNumber(null);
      user.setPasswordHash(encoder.encode(UUID.randomUUID().toString()));
      user.setRole("USER");
      return users.save(user);
    });
  }

  public User getProfile(String tenantId, String email) {
    return users.findByEmailAndTenantId(email, tenantId).orElseThrow();
  }

  private void validateRegistrationInput(
      String firstName,
      String lastName,
      String email,
      String password,
      String mobileNumber
  ) {
    if (firstName == null || firstName.trim().isEmpty()) {
      throw new IllegalArgumentException("First name is required");
    }
    if (lastName == null || lastName.trim().isEmpty()) {
      throw new IllegalArgumentException("Last name is required");
    }
    if (email == null || email.isBlank()) {
      throw new IllegalArgumentException("Email is required");
    }
    if (password == null || password.length() < 6) {
      throw new IllegalArgumentException("Password must be at least 6 characters");
    }
    if (mobileNumber == null || !mobileNumber.matches("^\\+[1-9]\\d{6,14}$")) {
      throw new IllegalArgumentException("Mobile number must include country code, e.g. +919876543210");
    }
  }
}
