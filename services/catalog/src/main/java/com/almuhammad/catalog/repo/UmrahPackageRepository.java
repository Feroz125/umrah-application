package com.almuhammad.catalog.repo;

import com.almuhammad.catalog.domain.UmrahPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UmrahPackageRepository extends JpaRepository<UmrahPackage, Long> {
  Optional<UmrahPackage> findByCode(String code);
  List<UmrahPackage> findByTenantIdIn(List<String> tenantIds);
  Optional<UmrahPackage> findByIdAndTenantId(Long id, String tenantId);
  long countByTenantId(String tenantId);
}
