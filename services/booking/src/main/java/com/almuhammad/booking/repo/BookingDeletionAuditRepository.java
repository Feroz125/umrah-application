package com.almuhammad.booking.repo;

import com.almuhammad.booking.domain.BookingDeletionAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingDeletionAuditRepository extends JpaRepository<BookingDeletionAudit, Long> {
}
