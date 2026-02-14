package com.almuhammad.payment.api;

import com.almuhammad.payment.domain.Payment;
import com.almuhammad.payment.domain.PaymentDeletionAudit;
import com.almuhammad.payment.repo.PaymentDeletionAuditRepository;
import com.almuhammad.payment.repo.PaymentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/payment")
public class PaymentAdminController {
  private final PaymentRepository repo;
  private final PaymentDeletionAuditRepository auditRepo;

  public PaymentAdminController(PaymentRepository repo, PaymentDeletionAuditRepository auditRepo) {
    this.repo = repo;
    this.auditRepo = auditRepo;
  }

  public record UpdatePaymentRequest(
      Integer amount,
      String status,
      String dueDate,
      String paidAt
  ) {}
  public record DeleteRequest(String reason) {}

  @GetMapping("/payments")
  public ResponseEntity<List<Payment>> list(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    return ResponseEntity.ok(repo.findByTenantId(normalizeTenant(tenant)));
  }

  @PutMapping("/payments/{id}")
  public ResponseEntity<?> update(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
      @PathVariable Long id,
      @RequestBody UpdatePaymentRequest req
  ) {
    String tenantId = normalizeTenant(tenant);
    Payment payment = repo.findById(id).orElse(null);
    if (payment == null || !tenantId.equals(payment.getTenantId())) {
      return ResponseEntity.status(404).body(Map.of("error", "Payment not found"));
    }

    if (req.amount() != null && req.amount() >= 0) {
      payment.setAmount(req.amount());
    }
    if (req.status() != null && !req.status().isBlank()) {
      payment.setStatus(req.status().trim().toLowerCase());
    }
    if (req.dueDate() != null) {
      LocalDate parsedDueDate = parseLocalDate(req.dueDate());
      if (parsedDueDate == null) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid dueDate format, expected YYYY-MM-DD"));
      }
      payment.setDueDate(parsedDueDate);
    }
    if (req.paidAt() != null) {
      if (req.paidAt().isBlank()) {
        payment.setPaidAt(null);
      } else {
        Instant parsedPaidAt = parseInstant(req.paidAt());
        if (parsedPaidAt == null) {
          return ResponseEntity.badRequest().body(Map.of("error", "Invalid paidAt format, expected ISO-8601"));
        }
        payment.setPaidAt(parsedPaidAt);
      }
    }

    return ResponseEntity.ok(repo.save(payment));
  }

  @DeleteMapping("/payments/{id}")
  public ResponseEntity<?> delete(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
      @RequestHeader(value = "X-User", required = false) String user,
      @PathVariable Long id,
      @RequestBody DeleteRequest req
  ) {
    String tenantId = normalizeTenant(tenant);
    String reason = req == null || req.reason() == null ? "" : req.reason().trim();
    if (reason.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "Delete reason is required"));
    }
    Payment payment = repo.findById(id).orElse(null);
    if (payment == null || !tenantId.equals(payment.getTenantId())) {
      return ResponseEntity.status(404).body(Map.of("error", "Payment not found"));
    }

    PaymentDeletionAudit audit = new PaymentDeletionAudit();
    audit.setPaymentId(payment.getId());
    audit.setBookingId(payment.getBookingId());
    audit.setAmount(payment.getAmount());
    audit.setStatus(payment.getStatus());
    audit.setInstallmentNumber(payment.getInstallmentNumber());
    audit.setTotalInstallments(payment.getTotalInstallments());
    audit.setDueDate(payment.getDueDate());
    audit.setPaidAt(payment.getPaidAt());
    audit.setReason(reason);
    audit.setDeletedBy(user == null || user.isBlank() ? "admin" : user);
    audit.setTenantId(tenantId);
    audit.setDeletedAt(Instant.now());
    auditRepo.save(audit);

    repo.delete(payment);
    return ResponseEntity.ok(Map.of("message", "Payment deleted", "reason", reason));
  }

  private String normalizeTenant(String tenant) {
    if (tenant == null || tenant.isBlank()) {
      return "public";
    }
    return tenant.trim().toLowerCase();
  }

  private LocalDate parseLocalDate(String value) {
    try {
      return LocalDate.parse(value.trim());
    } catch (Exception ex) {
      return null;
    }
  }

  private Instant parseInstant(String value) {
    try {
      return Instant.parse(value.trim());
    } catch (Exception ex) {
      return null;
    }
  }
}
