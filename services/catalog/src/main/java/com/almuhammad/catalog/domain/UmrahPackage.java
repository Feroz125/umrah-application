package com.almuhammad.catalog.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "packages")
public class UmrahPackage {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String code;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private Integer nights;

  @Column(nullable = false)
  private Integer price;

  private String description;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public Integer getNights() { return nights; }
  public void setNights(Integer nights) { this.nights = nights; }
  public Integer getPrice() { return price; }
  public void setPrice(Integer price) { this.price = price; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
}
