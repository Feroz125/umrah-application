package com.almuhammad.booking.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "bookings")
public class Booking {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String packageId;

  @Column(nullable = false)
  private String travelerName;

  @Column(nullable = false)
  private LocalDate travelDate;

  @Column(nullable = false)
  private String status;

  @Column(nullable = false)
  private String userEmail;

  @Column
  private String tenantId;

  @Column(nullable = false)
  private Instant createdAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getPackageId() { return packageId; }
  public void setPackageId(String packageId) { this.packageId = packageId; }
  public String getTravelerName() { return travelerName; }
  public void setTravelerName(String travelerName) { this.travelerName = travelerName; }
  public LocalDate getTravelDate() { return travelDate; }
  public void setTravelDate(LocalDate travelDate) { this.travelDate = travelDate; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getUserEmail() { return userEmail; }
  public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
