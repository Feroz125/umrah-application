package com.almuhammad.payment.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "payment_deletion_audit")
public class PaymentDeletionAudit {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long paymentId;

  @Column
  private String bookingId;

  @Column
  private Integer amount;

  @Column
  private String status;

  @Column
  private Integer installmentNumber;

  @Column
  private Integer totalInstallments;

  @Column
  private LocalDate dueDate;

  @Column
  private Instant paidAt;

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
  public Long getPaymentId() { return paymentId; }
  public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }
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
  public Instant getPaidAt() { return paidAt; }
  public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }
  public String getReason() { return reason; }
  public void setReason(String reason) { this.reason = reason; }
  public String getDeletedBy() { return deletedBy; }
  public void setDeletedBy(String deletedBy) { this.deletedBy = deletedBy; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public Instant getDeletedAt() { return deletedAt; }
  public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
}
