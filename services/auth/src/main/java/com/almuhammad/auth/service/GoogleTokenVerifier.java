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
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GoogleTokenVerifier {
  private final HttpClient httpClient = HttpClient.newHttpClient();
  private final ObjectMapper objectMapper;
  private final Set<String> googleClientIds;

  public GoogleTokenVerifier(
      ObjectMapper objectMapper,
      @Value("${security.google.clientId:}") String googleClientId
  ) {
    this.objectMapper = objectMapper;
    this.googleClientIds = Arrays.stream((googleClientId == null ? "" : googleClientId).split(","))
        .map(String::trim)
        .filter(value -> !value.isBlank())
        .collect(Collectors.toUnmodifiableSet());
  }

  public String verifyAndExtractEmail(String idToken) {
    String normalizedToken = normalizeToken(idToken);
    if (normalizedToken.isBlank()) {
      throw new IllegalArgumentException("Missing Google ID token");
    }
    if (googleClientIds.isEmpty()) {
      throw new IllegalArgumentException("Google Sign-In is not configured");
    }

    try {
      String token = URLEncoder.encode(normalizedToken, StandardCharsets.UTF_8);
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + token))
          .GET()
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 400) {
        throw new IllegalArgumentException("Invalid Google token");
      }

      Map<String, Object> payload = objectMapper.readValue(response.body(), Map.class);
      String aud = String.valueOf(payload.getOrDefault("aud", "")).trim();
      String azp = String.valueOf(payload.getOrDefault("azp", "")).trim();
      String email = String.valueOf(payload.getOrDefault("email", "")).trim();
      String emailVerified = String.valueOf(payload.getOrDefault("email_verified", "false"));

      if (!googleClientIds.contains(aud) && !googleClientIds.contains(azp)) {
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

  private String normalizeToken(String tokenInput) {
    if (tokenInput == null) {
      return "";
    }

    String token = tokenInput.trim();
    if (token.regionMatches(true, 0, "Bearer ", 0, 7)) {
      token = token.substring(7).trim();
    }
    if (token.startsWith("<") && token.endsWith(">") && token.length() > 2) {
      token = token.substring(1, token.length() - 1).trim();
    }
    if (token.startsWith("\"") && token.endsWith("\"") && token.length() > 2) {
      token = token.substring(1, token.length() - 1).trim();
    }
    return token;
  }
}
