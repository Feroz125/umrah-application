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
      if (users.findByEmail("admin@almuhammad.com").isEmpty()) {
        authService.register("admin@almuhammad.com", "admin123", "ADMIN");
      }
      if (users.findByEmail("user@almuhammad.com").isEmpty()) {
        authService.register("user@almuhammad.com", "user123", "USER");
      }
    };
  }
}
