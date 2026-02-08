package com.almuhammad.payment.api;

import com.almuhammad.payment.domain.Payment;
import com.almuhammad.payment.repo.PaymentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
public class PaymentController {
  private final PaymentRepository repo;

  public PaymentController(PaymentRepository repo) {
    this.repo = repo;
  }

  public record ChargeRequest(String bookingId, Integer amount) {}

  @PostMapping("/payment/charge")
  public ResponseEntity<Payment> charge(@RequestBody ChargeRequest payload) {
    Payment payment = new Payment();
    payment.setBookingId(payload.bookingId());
    payment.setAmount(payload.amount() == null ? 0 : payload.amount());
    payment.setStatus("paid");
    payment.setCreatedAt(Instant.now());
    return ResponseEntity.ok(repo.save(payment));
  }
}
