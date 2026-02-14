package com.almuhammad.booking.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "booking_deletion_audit")
public class BookingDeletionAudit {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long bookingId;

  @Column
  private String packageId;

  @Column
  private String travelerName;

  @Column
  private LocalDate travelDate;

  @Column
  private String bookingStatus;

  @Column
  private String userEmail;

  @Column(nullable = false)
  private String reason;

  @Column(nullable = false)
  private String deletedBy;

  @Column(nullable = false)
  private String tenantId;

  @Column(nullable = false)
  private Instant deletedAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getBookingId() { return bookingId; }
  public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
  public String getPackageId() { return packageId; }
  public void setPackageId(String packageId) { this.packageId = packageId; }
  public String getTravelerName() { return travelerName; }
  public void setTravelerName(String travelerName) { this.travelerName = travelerName; }
  public LocalDate getTravelDate() { return travelDate; }
  public void setTravelDate(LocalDate travelDate) { this.travelDate = travelDate; }
  public String getBookingStatus() { return bookingStatus; }
  public void setBookingStatus(String bookingStatus) { this.bookingStatus = bookingStatus; }
  public String getUserEmail() { return userEmail; }
  public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
  public String getReason() { return reason; }
  public void setReason(String reason) { this.reason = reason; }
  public String getDeletedBy() { return deletedBy; }
  public void setDeletedBy(String deletedBy) { this.deletedBy = deletedBy; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public Instant getDeletedAt() { return deletedAt; }
  public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
}
