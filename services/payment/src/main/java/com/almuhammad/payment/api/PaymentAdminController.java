package com.almuhammad.payment.api;

import com.almuhammad.payment.domain.Payment;
import com.almuhammad.payment.repo.PaymentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/payment")
public class PaymentAdminController {
  private final PaymentRepository repo;

  public PaymentAdminController(PaymentRepository repo) {
    this.repo = repo;
  }

  @GetMapping("/payments")
  public ResponseEntity<List<Payment>> list(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    return ResponseEntity.ok(repo.findByTenantId(normalizeTenant(tenant)));
  }

  private String normalizeTenant(String tenant) {
    if (tenant == null || tenant.isBlank()) {
      return "public";
    }
    return tenant.trim().toLowerCase();
  }
}
