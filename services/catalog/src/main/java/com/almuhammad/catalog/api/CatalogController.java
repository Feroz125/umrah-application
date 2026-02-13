package com.almuhammad.catalog.api;

import com.almuhammad.catalog.domain.UmrahPackage;
import com.almuhammad.catalog.repo.UmrahPackageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/catalog")
public class CatalogController {
  private final UmrahPackageRepository repo;

  public CatalogController(UmrahPackageRepository repo) {
    this.repo = repo;
  }

  @GetMapping("/packages")
  public ResponseEntity<List<UmrahPackage>> listPackages(
      @RequestHeader(value = "X-Tenant-ID", required = false) String tenant
  ) {
    String tenantId = normalizeTenant(tenant);
    return ResponseEntity.ok(repo.findByTenantIdIn(Arrays.asList(tenantId, "public")));
  }

  private String normalizeTenant(String tenant) {
    if (tenant == null || tenant.isBlank()) {
      return "public";
    }
    return tenant.trim().toLowerCase();
  }
}
