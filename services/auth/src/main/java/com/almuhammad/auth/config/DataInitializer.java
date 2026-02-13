package com.almuhammad.auth.config;

import com.almuhammad.auth.repo.UserRepository;
import com.almuhammad.auth.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {
  @Bean
  public CommandLineRunner seedUsers(UserRepository users, AuthService authService) {
    return args -> {
      users.findAll().forEach(user -> {
        if (user.getTenantId() == null || user.getTenantId().isBlank()) {
          user.setTenantId("public");
          users.save(user);
        }
      });

      if (users.findByEmailAndTenantId("admin@almuhammad.com", "public").isEmpty()) {
        authService.register("admin@almuhammad.com", "admin123", "ADMIN");
      }
      if (users.findByEmailAndTenantId("user@almuhammad.com", "public").isEmpty()) {
        authService.register("user@almuhammad.com", "user123", "USER");
      }
    };
  }
}
