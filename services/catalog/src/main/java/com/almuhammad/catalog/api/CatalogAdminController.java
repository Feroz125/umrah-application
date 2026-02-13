package com.almuhammad.catalog.api;

import com.almuhammad.catalog.domain.UmrahPackage;
import com.almuhammad.catalog.repo.UmrahPackageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/admin/catalog")
public class CatalogAdminController {
  private final UmrahPackageRepository repo;

  public CatalogAdminController(UmrahPackageRepository repo) {
    this.repo = repo;
  }

  public record PackageRequest(String code, String name, Integer nights, Integer price, String description) {}

  @GetMapping("/packages")
  public ResponseEntity<List<UmrahPackage>> all(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    String tenantId = normalizeTenant(tenant);
    return ResponseEntity.ok(repo.findByTenantIdIn(Arrays.asList(tenantId, "public")));
  }

  @PostMapping("/packages")
  public ResponseEntity<UmrahPackage> create(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
      @RequestBody PackageRequest req
  ) {
    String tenantId = normalizeTenant(tenant);
    UmrahPackage p = new UmrahPackage();
    p.setCode(req.code());
    p.setName(req.name());
    p.setNights(req.nights());
    p.setPrice(req.price());
    p.setDescription(req.description());
    p.setTenantId(tenantId);
    return ResponseEntity.ok(repo.save(p));
  }

  @PutMapping("/packages/{id}")
  public ResponseEntity<UmrahPackage> update(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
      @PathVariable Long id,
      @RequestBody PackageRequest req
  ) {
    String tenantId = normalizeTenant(tenant);
    UmrahPackage p = repo.findByIdAndTenantId(id, tenantId).orElseThrow();
    if (req.code() != null) p.setCode(req.code());
    if (req.name() != null) p.setName(req.name());
    if (req.nights() != null) p.setNights(req.nights());
    if (req.price() != null) p.setPrice(req.price());
    if (req.description() != null) p.setDescription(req.description());
    return ResponseEntity.ok(repo.save(p));
  }

  @DeleteMapping("/packages/{id}")
  public ResponseEntity<Void> delete(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
      @PathVariable Long id
  ) {
    String tenantId = normalizeTenant(tenant);
    UmrahPackage p = repo.findByIdAndTenantId(id, tenantId).orElseThrow();
    repo.delete(p);
    return ResponseEntity.noContent().build();
  }

  private String normalizeTenant(String tenant) {
    if (tenant == null || tenant.isBlank()) {
      return "public";
    }
    return tenant.trim().toLowerCase();
  }
}
