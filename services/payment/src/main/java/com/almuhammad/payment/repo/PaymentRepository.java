package com.almuhammad.payment.repo;

import com.almuhammad.payment.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
  List<Payment> findByTenantId(String tenantId);
  List<Payment> findByTenantIdAndBookingIdOrderByInstallmentNumberAsc(String tenantId, String bookingId);
  boolean existsByTenantIdAndBookingId(String tenantId, String bookingId);
  Optional<Payment> findByTenantIdAndBookingIdAndInstallmentNumber(String tenantId, String bookingId, Integer installmentNumber);
}
