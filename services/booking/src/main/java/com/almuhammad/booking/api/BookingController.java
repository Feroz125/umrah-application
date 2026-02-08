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
    @RequestHeader(value = "X-User", required = false) String user
  ) {
    Booking booking = new Booking();
    booking.setPackageId(req.packageId());
    booking.setTravelerName(req.travelerName());
    booking.setTravelDate(LocalDate.parse(req.travelDate()));
    booking.setStatus("reserved");
    booking.setUserEmail(user == null ? "guest" : user);
    booking.setCreatedAt(Instant.now());
    return ResponseEntity.ok(repo.save(booking));
  }

  @GetMapping("/booking/{id}")
  public ResponseEntity<Booking> get(@PathVariable Long id) {
    return ResponseEntity.ok(repo.findById(id).orElseThrow());
  }
}
