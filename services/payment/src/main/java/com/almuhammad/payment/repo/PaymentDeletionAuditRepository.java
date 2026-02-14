package com.almuhammad.payment.repo;

import com.almuhammad.payment.domain.PaymentDeletionAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentDeletionAuditRepository extends JpaRepository<PaymentDeletionAudit, Long> {
}
