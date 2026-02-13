package com.almuhammad.booking.api;

import com.almuhammad.booking.domain.Booking;
import com.almuhammad.booking.repo.BookingRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
public class BookingController {
  private final BookingRepository repo;

  public BookingController(BookingRepository repo) {
    this.repo = repo;
  }

  public record CreateBookingRequest(
    @NotBlank String packageId,
    @NotBlank String travelerName,
    @NotBlank String travelDate
  ) {}

  @PostMapping("/booking")
  public ResponseEntity<Booking> create(
    @Valid @RequestBody CreateBookingRequest req,
    @RequestHeader(value = "X-User", required = false) String user,
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    Booking booking = new Booking();
    booking.setPackageId(req.packageId());
    booking.setTravelerName(req.travelerName());
    booking.setTravelDate(LocalDate.parse(req.travelDate()));
    booking.setStatus("reserved");
    booking.setUserEmail(user == null ? "guest" : user.trim().toLowerCase());
    booking.setTenantId(normalizeTenant(tenant));
    booking.setCreatedAt(Instant.now());
    return ResponseEntity.ok(repo.save(booking));
  }

  @GetMapping("/booking/{id}")
  public ResponseEntity<Booking> get(
      @PathVariable Long id,
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    return ResponseEntity.ok(repo.findByIdAndTenantId(id, normalizeTenant(tenant)).orElseThrow());
  }

  @GetMapping("/booking/my")
  public ResponseEntity<?> myBookings(
      @RequestHeader(value = "X-User", required = false) String user,
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    if (user == null || user.isBlank()) {
      return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
    }
    List<Booking> bookings = repo.findByTenantIdAndUserEmailOrderByCreatedAtDesc(
        normalizeTenant(tenant),
        user.trim().toLowerCase()
    );
    return ResponseEntity.ok(bookings);
  }

  private String normalizeTenant(String tenant) {
    if (tenant == null || tenant.isBlank()) {
      return "public";
    }
    return tenant.trim().toLowerCase();
  }
}
