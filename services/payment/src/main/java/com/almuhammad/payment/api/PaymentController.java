package com.almuhammad.payment.api;

import com.almuhammad.payment.domain.Payment;
import com.almuhammad.payment.repo.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
public class PaymentController {
  private final PaymentRepository repo;
  private final String razorpayKeyId;
  private final String razorpayKeySecret;

  public PaymentController(
      PaymentRepository repo,
      @Value("${razorpay.key-id:}") String razorpayKeyId,
      @Value("${razorpay.key-secret:}") String razorpayKeySecret
  ) {
    this.repo = repo;
    this.razorpayKeyId = razorpayKeyId;
    this.razorpayKeySecret = razorpayKeySecret;
  }

  public record ChargeRequest(String bookingId, Integer amount) {}
  public record InstallmentPlanRequest(String bookingId, Integer totalAmount, String travelDate) {}
  public record InstallmentPayRequest(String bookingId, Integer installmentNumber) {}
  public record RazorpayOrderRequest(String bookingId, Integer installmentNumber, String paymentMethod) {}
  public record RazorpayVerifyRequest(
      String bookingId,
      Integer installmentNumber,
      String razorpayOrderId,
      String razorpayPaymentId,
      String razorpaySignature,
      String paymentMethod
  ) {}

  @PostMapping("/payment/charge")
  public ResponseEntity<Payment> charge(
      @RequestBody ChargeRequest payload,
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    Payment payment = new Payment();
    payment.setBookingId(payload.bookingId());
    payment.setAmount(payload.amount() == null ? 0 : payload.amount());
    payment.setStatus("paid");
    payment.setInstallmentNumber(1);
    payment.setTotalInstallments(1);
    payment.setDueDate(LocalDate.now());
    payment.setPaidAt(Instant.now());
    payment.setPaymentProvider("manual");
    payment.setPaymentMethod("manual");
    payment.setTenantId(normalizeTenant(tenant));
    payment.setCreatedAt(Instant.now());
    return ResponseEntity.ok(repo.save(payment));
  }

  @PostMapping("/payment/installments/plan")
  public ResponseEntity<?> createInstallmentPlan(
      @RequestBody InstallmentPlanRequest payload,
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    String bookingId = payload.bookingId() == null ? "" : payload.bookingId().trim();
    int totalAmount = payload.totalAmount() == null ? 0 : payload.totalAmount();
    LocalDate travelDate = parseDate(payload.travelDate());
    if (bookingId.isBlank() || totalAmount <= 0 || travelDate == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "bookingId, totalAmount and travelDate are required"));
    }
    if (!travelDate.isAfter(LocalDate.now())) {
      return ResponseEntity.badRequest().body(Map.of("error", "Travel date must be in the future"));
    }

    String tenantId = normalizeTenant(tenant);
    if (repo.existsByTenantIdAndBookingId(tenantId, bookingId)) {
      return ResponseEntity.ok(repo.findByTenantIdAndBookingIdOrderByInstallmentNumberAsc(tenantId, bookingId));
    }

    int parts = 3;
    int base = totalAmount / parts;
    int remainder = totalAmount % parts;
    LocalDate[] dueDates = resolveDueDates(travelDate);
    List<Payment> installments = new ArrayList<>();
    for (int i = 1; i <= parts; i++) {
      int amount = base + (i <= remainder ? 1 : 0);
      Payment payment = new Payment();
      payment.setBookingId(bookingId);
      payment.setAmount(amount);
      payment.setStatus("due");
      payment.setInstallmentNumber(i);
      payment.setTotalInstallments(parts);
      payment.setDueDate(dueDates[i - 1]);
      payment.setTravelDate(travelDate);
      payment.setPaidAt(null);
      payment.setPaymentProvider("razorpay");
      payment.setTenantId(tenantId);
      payment.setCreatedAt(Instant.now());
      installments.add(repo.save(payment));
    }
    installments.sort(Comparator.comparing(p -> p.getInstallmentNumber() == null ? 0 : p.getInstallmentNumber()));
    return ResponseEntity.ok(installments);
  }

  @GetMapping("/payment/installments/{bookingId}")
  public ResponseEntity<List<Payment>> getInstallments(
      @PathVariable String bookingId,
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    String tenantId = normalizeTenant(tenant);
    return ResponseEntity.ok(repo.findByTenantIdAndBookingIdOrderByInstallmentNumberAsc(tenantId, bookingId));
  }

  @PostMapping("/payment/installments/pay")
  public ResponseEntity<?> payInstallment(
      @RequestBody InstallmentPayRequest payload,
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    String bookingId = payload.bookingId() == null ? "" : payload.bookingId().trim();
    Integer installmentNumber = payload.installmentNumber();
    if (bookingId.isBlank() || installmentNumber == null || installmentNumber < 1) {
      return ResponseEntity.badRequest().body(Map.of("error", "bookingId and installmentNumber are required"));
    }
    String tenantId = normalizeTenant(tenant);
    Payment installment = repo.findByTenantIdAndBookingIdAndInstallmentNumber(tenantId, bookingId, installmentNumber)
        .orElse(null);
    if (installment == null) {
      return ResponseEntity.status(404).body(Map.of("error", "Installment not found"));
    }
    LocalDate today = LocalDate.now();
    if (installment.getTravelDate() != null && !today.isBefore(installment.getTravelDate())) {
      return ResponseEntity.badRequest().body(Map.of("error", "Installments must be paid before travel date"));
    }
    if (!"paid".equalsIgnoreCase(installment.getStatus())) {
      installment.setStatus("paid");
      installment.setPaidAt(Instant.now());
      repo.save(installment);
    }
    return ResponseEntity.ok(installment);
  }

  @PostMapping("/payment/razorpay/order")
  public ResponseEntity<?> createRazorpayOrder(
      @RequestBody RazorpayOrderRequest payload,
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    if (razorpayKeyId.isBlank() || razorpayKeySecret.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "Razorpay is not configured on server"));
    }
    String bookingId = payload.bookingId() == null ? "" : payload.bookingId().trim();
    Integer installmentNumber = payload.installmentNumber();
    if (bookingId.isBlank() || installmentNumber == null || installmentNumber < 1) {
      return ResponseEntity.badRequest().body(Map.of("error", "bookingId and installmentNumber are required"));
    }

    String tenantId = normalizeTenant(tenant);
    Payment installment = repo.findByTenantIdAndBookingIdAndInstallmentNumber(tenantId, bookingId, installmentNumber)
        .orElse(null);
    if (installment == null) {
      return ResponseEntity.status(404).body(Map.of("error", "Installment not found"));
    }
    if ("paid".equalsIgnoreCase(installment.getStatus())) {
      return ResponseEntity.badRequest().body(Map.of("error", "Installment is already paid"));
    }
    if (installment.getTravelDate() != null && !LocalDate.now().isBefore(installment.getTravelDate())) {
      return ResponseEntity.badRequest().body(Map.of("error", "Installments must be paid before travel date"));
    }

    try {
      RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
      JSONObject options = new JSONObject();
      options.put("amount", installment.getAmount() * 100);
      options.put("currency", "INR");
      options.put("receipt", "booking-" + bookingId + "-inst-" + installmentNumber);
      options.put("payment_capture", 1);
      JSONObject notes = new JSONObject();
      notes.put("bookingId", bookingId);
      notes.put("installmentNumber", installmentNumber);
      notes.put("tenantId", tenantId);
      notes.put("paymentMethod", payload.paymentMethod() == null ? "" : payload.paymentMethod());
      options.put("notes", notes);

      Order order = razorpay.orders.create(options);
      String orderId = order.get("id");
      installment.setExternalOrderId(orderId);
      installment.setPaymentProvider("razorpay");
      if (payload.paymentMethod() != null && !payload.paymentMethod().isBlank()) {
        installment.setPaymentMethod(payload.paymentMethod().trim().toLowerCase());
      }
      repo.save(installment);

      return ResponseEntity.ok(Map.of(
          "orderId", orderId,
          "amount", installment.getAmount() * 100,
          "currency", "INR",
          "keyId", razorpayKeyId,
          "name", "Al-Muhammad Travels",
          "description", "Installment " + installmentNumber + " for booking " + bookingId
      ));
    } catch (Exception ex) {
      return ResponseEntity.badRequest().body(Map.of("error", "Unable to create Razorpay order"));
    }
  }

  @PostMapping("/payment/razorpay/verify")
  public ResponseEntity<?> verifyRazorpayPayment(
      @RequestBody RazorpayVerifyRequest payload,
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    if (razorpayKeySecret.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "Razorpay is not configured on server"));
    }
    String bookingId = payload.bookingId() == null ? "" : payload.bookingId().trim();
    Integer installmentNumber = payload.installmentNumber();
    if (bookingId.isBlank() || installmentNumber == null || installmentNumber < 1) {
      return ResponseEntity.badRequest().body(Map.of("error", "bookingId and installmentNumber are required"));
    }
    if (payload.razorpayOrderId() == null || payload.razorpayPaymentId() == null || payload.razorpaySignature() == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "Missing Razorpay verification parameters"));
    }

    String tenantId = normalizeTenant(tenant);
    Payment installment = repo.findByTenantIdAndBookingIdAndInstallmentNumber(tenantId, bookingId, installmentNumber)
        .orElse(null);
    if (installment == null) {
      return ResponseEntity.status(404).body(Map.of("error", "Installment not found"));
    }
    if (installment.getTravelDate() != null && !LocalDate.now().isBefore(installment.getTravelDate())) {
      return ResponseEntity.badRequest().body(Map.of("error", "Installments must be paid before travel date"));
    }

    try {
      String expectedSignature = hmacSha256(payload.razorpayOrderId() + "|" + payload.razorpayPaymentId(), razorpayKeySecret);
      if (!expectedSignature.equals(payload.razorpaySignature())) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid payment signature"));
      }
      installment.setStatus("paid");
      installment.setPaidAt(Instant.now());
      installment.setExternalOrderId(payload.razorpayOrderId());
      installment.setExternalPaymentId(payload.razorpayPaymentId());
      installment.setPaymentProvider("razorpay");
      if (payload.paymentMethod() != null && !payload.paymentMethod().isBlank()) {
        installment.setPaymentMethod(payload.paymentMethod().trim().toLowerCase());
      }
      repo.save(installment);
      return ResponseEntity.ok(installment);
    } catch (Exception ex) {
      return ResponseEntity.badRequest().body(Map.of("error", "Unable to verify Razorpay payment"));
    }
  }

  private String normalizeTenant(String tenant) {
    if (tenant == null || tenant.isBlank()) {
      return "public";
    }
    return tenant.trim().toLowerCase();
  }

  private LocalDate parseDate(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    try {
      return LocalDate.parse(value.trim());
    } catch (Exception ex) {
      return null;
    }
  }

  private LocalDate[] resolveDueDates(LocalDate travelDate) {
    LocalDate today = LocalDate.now();
    LocalDate d1 = travelDate.minusDays(45);
    LocalDate d2 = travelDate.minusDays(30);
    LocalDate d3 = travelDate.minusDays(15);

    if (!d1.isAfter(today)) {
      d1 = today.plusDays(1);
    }
    if (!d2.isAfter(d1)) {
      d2 = d1.plusDays(7);
    }
    if (!d3.isAfter(d2)) {
      d3 = d2.plusDays(7);
    }
    if (!d3.isBefore(travelDate)) {
      d3 = travelDate.minusDays(1);
      if (!d3.isAfter(d2)) {
        d2 = d3.minusDays(1);
      }
      if (!d2.isAfter(d1)) {
        d1 = d2.minusDays(1);
      }
      if (!d1.isAfter(today)) {
        d1 = today.plusDays(1);
      }
    }
    return new LocalDate[]{d1, d2, d3};
  }

  private String hmacSha256(String data, String secret) throws Exception {
    Mac sha256Hmac = Mac.getInstance("HmacSHA256");
    SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    sha256Hmac.init(secretKey);
    byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    StringBuilder result = new StringBuilder();
    for (byte b : hash) {
      result.append(String.format("%02x", b));
    }
    return result.toString();
  }
}
