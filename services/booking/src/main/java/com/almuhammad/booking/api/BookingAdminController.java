package com.almuhammad.booking.api;

import com.almuhammad.booking.domain.Booking;
import com.almuhammad.booking.repo.BookingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/booking")
public class BookingAdminController {
  private final BookingRepository repo;

  public BookingAdminController(BookingRepository repo) {
    this.repo = repo;
  }

  @GetMapping("/bookings")
  public ResponseEntity<List<Booking>> list() {
    return ResponseEntity.ok(repo.findAll());
  }
}
