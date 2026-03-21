package com.hh.finance.dto;

import com.hh.finance.domain.Income;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class IncomeDtos {

    private IncomeDtos() {}

    public record IncomeCreateRequest(
            @NotBlank @Size(max = 512) String description,
            @NotNull @DecimalMin("0.01") BigDecimal amount,
            @NotBlank @Size(max = 100) String category,
            @NotNull @Min(1) @Max(12) Integer month,
            @NotNull @Min(2000) @Max(2100) Integer year,
            @NotNull LocalDate entryDate,
            @Size(max = 2000) String notes) {}

    public record IncomeResponse(
            long id,
            String description,
            BigDecimal amount,
            String category,
            int month,
            int year,
            LocalDate entryDate,
            String notes) {

        public static IncomeResponse from(Income i) {
            return new IncomeResponse(
                    i.getId(),
                    i.getDescription(),
                    i.getAmount(),
                    i.getCategory(),
                    i.getMonth(),
                    i.getYear(),
                    i.getEntryDate(),
                    i.getNotes());
        }
    }
}
