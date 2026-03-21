package com.hh.finance.dto;

import com.hh.finance.domain.Expense;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class ExpenseDtos {

    private ExpenseDtos() {}

    public record ExpenseCreateRequest(
            @NotBlank @Size(max = 512) String description,
            @NotNull @DecimalMin("0.01") BigDecimal amount,
            @NotBlank @Size(max = 100) String category,
            @NotNull Expense.ExpenseType expenseType,
            @NotNull @Min(1) @Max(12) Integer month,
            @NotNull @Min(2000) @Max(2100) Integer year,
            @NotNull LocalDate entryDate,
            @Size(max = 2000) String notes,
            Long subscriptionId) {}

    public record ExpenseResponse(
            long id,
            String description,
            BigDecimal amount,
            String category,
            Expense.ExpenseType expenseType,
            int month,
            int year,
            LocalDate entryDate,
            String notes,
            Long subscriptionId) {

        public static ExpenseResponse from(Expense e) {
            return new ExpenseResponse(
                    e.getId(),
                    e.getDescription(),
                    e.getAmount(),
                    e.getCategory(),
                    e.getExpenseType(),
                    e.getMonth(),
                    e.getYear(),
                    e.getEntryDate(),
                    e.getNotes(),
                    e.getSubscription() != null ? e.getSubscription().getId() : null);
        }
    }
}
