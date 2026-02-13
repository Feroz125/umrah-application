package com.almuhammad.catalog.config;

import com.almuhammad.catalog.domain.UmrahPackage;
import com.almuhammad.catalog.repo.UmrahPackageRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {
  @Bean
  public CommandLineRunner seedPackages(UmrahPackageRepository repo) {
    return args -> {
      repo.findAll().forEach(p -> {
        if (p.getTenantId() == null || p.getTenantId().isBlank()) {
          p.setTenantId("public");
          repo.save(p);
        }
      });

      if (repo.countByTenantId("public") == 0) {
        UmrahPackage basic = new UmrahPackage();
        basic.setCode("umrah-basic");
        basic.setName("Umrah Basic");
        basic.setNights(7);
        basic.setPrice(1250);
        basic.setDescription("Essential package with guided support.");
        basic.setTenantId("public");
        repo.save(basic);

        UmrahPackage plus = new UmrahPackage();
        plus.setCode("umrah-plus");
        plus.setName("Umrah Plus");
        plus.setNights(10);
        plus.setPrice(1850);
        plus.setDescription("Extended stay with premium hotels.");
        plus.setTenantId("public");
        repo.save(plus);

        UmrahPackage premium = new UmrahPackage();
        premium.setCode("umrah-premium");
        premium.setName("Umrah Premium");
        premium.setNights(14);
        premium.setPrice(2450);
        premium.setDescription("VIP experience with concierge service.");
        premium.setTenantId("public");
        repo.save(premium);
      }
    };
  }
}
