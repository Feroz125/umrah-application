package com.almuhammad.catalog.api;

import com.almuhammad.catalog.domain.UmrahPackage;
import com.almuhammad.catalog.repo.UmrahPackageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
  public ResponseEntity<List<UmrahPackage>> all() {
    return ResponseEntity.ok(repo.findAll());
  }

  @PostMapping("/packages")
  public ResponseEntity<UmrahPackage> create(@RequestBody PackageRequest req) {
    UmrahPackage p = new UmrahPackage();
    p.setCode(req.code());
    p.setName(req.name());
    p.setNights(req.nights());
    p.setPrice(req.price());
    p.setDescription(req.description());
    return ResponseEntity.ok(repo.save(p));
  }

  @PutMapping("/packages/{id}")
  public ResponseEntity<UmrahPackage> update(@PathVariable Long id, @RequestBody PackageRequest req) {
    UmrahPackage p = repo.findById(id).orElseThrow();
    if (req.code() != null) p.setCode(req.code());
    if (req.name() != null) p.setName(req.name());
    if (req.nights() != null) p.setNights(req.nights());
    if (req.price() != null) p.setPrice(req.price());
    if (req.description() != null) p.setDescription(req.description());
    return ResponseEntity.ok(repo.save(p));
  }

  @DeleteMapping("/packages/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    repo.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}
