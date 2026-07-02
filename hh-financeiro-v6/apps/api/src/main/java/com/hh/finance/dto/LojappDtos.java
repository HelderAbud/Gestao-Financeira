package com.hh.finance.dto;

import com.hh.finance.domain.Brand;
import com.hh.finance.domain.Product;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class LojappDtos {

    public record BrandRequest(@NotBlank String name) {}

    public record BrandResponse(Long id, String name) {
        public static BrandResponse from(Brand brand) {
            return new BrandResponse(brand.getId(), brand.getName());
        }
    }

    public record ProductRequest(
            @NotBlank String name,
            Long brandId,
            String ean,
            String ncm,
            String sku,
            @NotNull @DecimalMin("0.00") BigDecimal costPrice,
            @NotNull @DecimalMin("0.00") BigDecimal salePrice,
            @NotNull @DecimalMin("0.000") BigDecimal minimumStock) {}

    public record ProductResponse(
            Long id,
            String name,
            String brandName,
            String ean,
            String ncm,
            String sku,
            BigDecimal costPrice,
            BigDecimal salePrice,
            BigDecimal minimumStock) {
        public static ProductResponse from(Product product) {
            String brandName = product.getBrand() == null ? "Nao informada" : product.getBrand().getName();
            return new ProductResponse(
                    product.getId(),
                    product.getName(),
                    brandName,
                    product.getEan(),
                    product.getNcm(),
                    product.getSku(),
                    product.getCostPrice(),
                    product.getSalePrice(),
                    product.getMinimumStock());
        }
    }

    public record NfeImportRequest(@NotBlank String rawXml) {}

    public record NfeImportResponse(Long nfeEntryId, String nfeNumber, int importedItems) {}

    public record StockAdjustmentRequest(
            @NotNull Long productId,
            @NotNull BigDecimal quantity,
            @NotBlank String reason) {}

    public record SaleRequest(
            @NotNull Long productId,
            @NotNull @DecimalMin("0.001") BigDecimal quantity,
            @NotNull @DecimalMin("0.00") BigDecimal unitPrice,
            @NotNull @DecimalMin("0.00") BigDecimal unitCost) {}

    public record LowStockResponse(Long productId, String productName, BigDecimal currentQuantity, BigDecimal minimumStock) {}

    public record BrandKpiResponse(
            String brand,
            BigDecimal faturamento,
            BigDecimal lucro,
            BigDecimal quantidadeVendida,
            BigDecimal margem,
            String giro,
            String insight) {}

    public record BrandDashboardResponse(Instant from, Instant to, List<BrandKpiResponse> metrics) {}
}
