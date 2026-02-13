package com.almuhammad.booking.repo;

import com.almuhammad.booking.domain.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
  Optional<Booking> findByIdAndTenantId(Long id, String tenantId);
  List<Booking> findByTenantId(String tenantId);
  List<Booking> findByTenantIdAndUserEmailOrderByCreatedAtDesc(String tenantId, String userEmail);
}
