package com.hh.finance.controller;

import com.hh.finance.dto.LojappDtos.BrandDashboardResponse;
import com.hh.finance.dto.LojappDtos.BrandRequest;
import com.hh.finance.dto.LojappDtos.BrandResponse;
import com.hh.finance.dto.LojappDtos.LowStockResponse;
import com.hh.finance.dto.LojappDtos.NfeImportRequest;
import com.hh.finance.dto.LojappDtos.NfeImportResponse;
import com.hh.finance.dto.LojappDtos.ProductRequest;
import com.hh.finance.dto.LojappDtos.ProductResponse;
import com.hh.finance.dto.LojappDtos.SaleRequest;
import com.hh.finance.dto.LojappDtos.StockAdjustmentRequest;
import com.hh.finance.security.CurrentUser;
import com.hh.finance.service.LojappCoreService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/lojapp")
@Tag(name = "LojApp")
@SecurityRequirement(name = "bearerAuth")
public class LojappController {

    private final LojappCoreService service;

    public LojappController(LojappCoreService service) {
        this.service = service;
    }

    @GetMapping("/brands")
    public List<BrandResponse> listBrands() {
        return service.listBrands(CurrentUser.id());
    }

    @PostMapping("/brands")
    public BrandResponse createBrand(@Valid @RequestBody BrandRequest request) {
        return service.createBrand(CurrentUser.id(), request);
    }

    @GetMapping("/products")
    public List<ProductResponse> listProducts() {
        return service.listProducts(CurrentUser.id());
    }

    @PostMapping("/products")
    public ProductResponse createProduct(@Valid @RequestBody ProductRequest request) {
        return service.createProduct(CurrentUser.id(), request);
    }

    @PutMapping("/products/{id}")
    public ProductResponse updateProduct(@PathVariable long id, @Valid @RequestBody ProductRequest request) {
        return service.updateProduct(CurrentUser.id(), id, request);
    }

    @PostMapping("/nfe/import")
    public NfeImportResponse importNfe(@Valid @RequestBody NfeImportRequest request) {
        return service.importNfe(CurrentUser.id(), request.rawXml());
    }

    @PostMapping("/inventory/adjust")
    public void adjustStock(@Valid @RequestBody StockAdjustmentRequest request) {
        service.adjustStock(CurrentUser.id(), request);
    }

    @GetMapping("/inventory/low-stock")
    public List<LowStockResponse> lowStock() {
        return service.listLowStock(CurrentUser.id());
    }

    @PostMapping("/sales")
    public void registerSale(@Valid @RequestBody SaleRequest request) {
        service.registerSale(CurrentUser.id(), request);
    }

    @GetMapping("/dashboard/brands")
    public BrandDashboardResponse dashboardByBrand(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        Instant end = to == null ? Instant.now() : to;
        Instant start = from == null ? end.minus(30, ChronoUnit.DAYS) : from;
        return service.brandDashboard(CurrentUser.id(), start, end);
    }
}
