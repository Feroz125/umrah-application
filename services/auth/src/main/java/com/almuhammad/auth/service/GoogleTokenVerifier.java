package com.almuhammad.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class GoogleTokenVerifier {
  private final HttpClient httpClient = HttpClient.newHttpClient();
  private final ObjectMapper objectMapper;
  private final String googleClientId;

  public GoogleTokenVerifier(
      ObjectMapper objectMapper,
      @Value("${security.google.clientId:}") String googleClientId
  ) {
    this.objectMapper = objectMapper;
    this.googleClientId = googleClientId == null ? "" : googleClientId.trim();
  }

  public String verifyAndExtractEmail(String idToken) {
    if (idToken == null || idToken.isBlank()) {
      throw new IllegalArgumentException("Missing Google ID token");
    }
    if (googleClientId.isBlank()) {
      throw new IllegalArgumentException("Google Sign-In is not configured");
    }

    try {
      String token = URLEncoder.encode(idToken, StandardCharsets.UTF_8);
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + token))
          .GET()
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 400) {
        throw new IllegalArgumentException("Invalid Google token");
      }

      Map<String, Object> payload = objectMapper.readValue(response.body(), Map.class);
      String aud = String.valueOf(payload.getOrDefault("aud", ""));
      String email = String.valueOf(payload.getOrDefault("email", ""));
      String emailVerified = String.valueOf(payload.getOrDefault("email_verified", "false"));

      if (!googleClientId.equals(aud)) {
        throw new IllegalArgumentException("Google token audience mismatch");
      }
      if (!"true".equalsIgnoreCase(emailVerified)) {
        throw new IllegalArgumentException("Google account email is not verified");
      }
      if (email.isBlank()) {
        throw new IllegalArgumentException("Google token is missing email");
      }
      return email;
    } catch (IllegalArgumentException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new IllegalArgumentException("Google token verification failed");
    }
  }
}
