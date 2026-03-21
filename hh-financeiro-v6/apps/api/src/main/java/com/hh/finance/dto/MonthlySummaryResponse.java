package com.hh.finance.dto;

import java.math.BigDecimal;

public record MonthlySummaryResponse(
        int year,
        int month,
        BigDecimal totalIncome,
        BigDecimal totalExpenseOutflows,
        BigDecimal totalInvestments,
        BigDecimal balance) {}
