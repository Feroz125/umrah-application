package com.almuhammad.auth.service;

import com.almuhammad.auth.domain.User;
import com.almuhammad.auth.repo.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final UserRepository users;
  private final PasswordEncoder encoder;

  public AuthService(UserRepository users, PasswordEncoder encoder) {
    this.users = users;
    this.encoder = encoder;
  }

  public User register(String email, String password, String role) {
    User user = new User();
    user.setEmail(email);
    user.setPasswordHash(encoder.encode(password));
    user.setRole(role);
    return users.save(user);
  }

  public User authenticate(String email, String password) {
    User user = users.findByEmail(email).orElseThrow();
    if (!encoder.matches(password, user.getPasswordHash())) {
      throw new IllegalArgumentException("Invalid credentials");
    }
    return user;
  }
}
