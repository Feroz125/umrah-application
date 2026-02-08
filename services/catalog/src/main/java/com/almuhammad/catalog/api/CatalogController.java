package com.almuhammad.catalog.api;

import com.almuhammad.catalog.domain.UmrahPackage;
import com.almuhammad.catalog.repo.UmrahPackageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/catalog")
public class CatalogController {
  private final UmrahPackageRepository repo;

  public CatalogController(UmrahPackageRepository repo) {
    this.repo = repo;
  }

  @GetMapping("/packages")
  public ResponseEntity<List<UmrahPackage>> listPackages() {
    return ResponseEntity.ok(repo.findAll());
  }
}
