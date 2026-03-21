package com.hh.finance.dto;

import com.hh.finance.domain.Budget;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public final class BudgetDtos {

    private BudgetDtos() {}

    public record BudgetUpsertRequest(
            @NotNull @Min(2000) @Max(2100) Integer year,
            @NotNull @Min(1) @Max(12) Integer month,
            @NotBlank @Size(max = 100) String category,
            @NotNull @DecimalMin("0") BigDecimal plannedAmount) {}

    public record BudgetResponse(
            long id, int year, int month, String category, BigDecimal plannedAmount) {

        public static BudgetResponse from(Budget b) {
            return new BudgetResponse(
                    b.getId(), b.getYear(), b.getMonth(), b.getCategory(), b.getPlannedAmount());
        }
    }
}
