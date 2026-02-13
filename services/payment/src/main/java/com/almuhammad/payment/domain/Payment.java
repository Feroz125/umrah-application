package com.almuhammad.payment.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "payments")
public class Payment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String bookingId;

  @Column(nullable = false)
  private Integer amount;

  @Column(nullable = false)
  private String status;

  @Column
  private Integer installmentNumber;

  @Column
  private Integer totalInstallments;

  @Column
  private LocalDate dueDate;

  @Column
  private LocalDate travelDate;

  @Column
  private Instant paidAt;

  @Column
  private String tenantId;

  @Column(nullable = false)
  private Instant createdAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getBookingId() { return bookingId; }
  public void setBookingId(String bookingId) { this.bookingId = bookingId; }
  public Integer getAmount() { return amount; }
  public void setAmount(Integer amount) { this.amount = amount; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public Integer getInstallmentNumber() { return installmentNumber; }
  public void setInstallmentNumber(Integer installmentNumber) { this.installmentNumber = installmentNumber; }
  public Integer getTotalInstallments() { return totalInstallments; }
  public void setTotalInstallments(Integer totalInstallments) { this.totalInstallments = totalInstallments; }
  public LocalDate getDueDate() { return dueDate; }
  public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
  public LocalDate getTravelDate() { return travelDate; }
  public void setTravelDate(LocalDate travelDate) { this.travelDate = travelDate; }
  public Instant getPaidAt() { return paidAt; }
  public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
