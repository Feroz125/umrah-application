package com.almuhammad.booking.api;

import com.almuhammad.booking.domain.Booking;
import com.almuhammad.booking.domain.BookingDeletionAudit;
import com.almuhammad.booking.repo.BookingDeletionAuditRepository;
import com.almuhammad.booking.repo.BookingRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/booking")
public class BookingAdminController {
  private final BookingRepository repo;
  private final BookingDeletionAuditRepository auditRepo;

  public BookingAdminController(BookingRepository repo, BookingDeletionAuditRepository auditRepo) {
    this.repo = repo;
    this.auditRepo = auditRepo;
  }

  public record DeleteRequest(String reason) {}

  @GetMapping("/bookings")
  public ResponseEntity<List<Booking>> list(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    return ResponseEntity.ok(repo.findByTenantId(normalizeTenant(tenant)));
  }

  @DeleteMapping("/bookings/{id}")
  public ResponseEntity<?> delete(
      @PathVariable Long id,
      @RequestBody DeleteRequest request,
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
      @RequestHeader(value = "X-User", required = false) String user
  ) {
    String tenantId = normalizeTenant(tenant);
    String reason = request == null || request.reason() == null ? "" : request.reason().trim();
    if (reason.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "Delete reason is required"));
    }

    Booking booking = repo.findByIdAndTenantId(id, tenantId).orElse(null);
    if (booking == null) {
      return ResponseEntity.status(404).body(Map.of("error", "Booking not found"));
    }

    BookingDeletionAudit audit = new BookingDeletionAudit();
    audit.setBookingId(booking.getId());
    audit.setPackageId(booking.getPackageId());
    audit.setTravelerName(booking.getTravelerName());
    audit.setTravelDate(booking.getTravelDate());
    audit.setBookingStatus(booking.getStatus());
    audit.setUserEmail(booking.getUserEmail());
    audit.setReason(reason);
    audit.setDeletedBy(user == null || user.isBlank() ? "admin" : user);
    audit.setTenantId(tenantId);
    audit.setDeletedAt(Instant.now());
    auditRepo.save(audit);

    repo.delete(booking);
    return ResponseEntity.ok(Map.of("message", "Booking deleted", "reason", reason));
  }

  private String normalizeTenant(String tenant) {
    if (tenant == null || tenant.isBlank()) {
      return "public";
    }
    return tenant.trim().toLowerCase();
  }
}
