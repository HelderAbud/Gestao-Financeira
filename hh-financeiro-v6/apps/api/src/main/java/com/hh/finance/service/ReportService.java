package com.hh.finance.service;

import com.hh.finance.domain.Expense;
import com.hh.finance.dto.MonthlySummaryResponse;
import com.hh.finance.repository.ExpenseRepository;
import com.hh.finance.repository.IncomeRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private static final String INVESTMENT_CATEGORY = "Investimento";

    private final IncomeRepository incomes;
    private final ExpenseRepository expenses;

    public ReportService(IncomeRepository incomes, ExpenseRepository expenses) {
        this.incomes = incomes;
        this.expenses = expenses;
    }

    @Transactional(readOnly = true)
    public MonthlySummaryResponse monthly(long userId, int year, int month) {
        BigDecimal totalIncome =
                incomes.findByUser_IdAndYearAndMonthOrderByEntryDateDesc(userId, year, month)
                        .stream()
                        .map(i -> i.getAmount())
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Expense> monthExpenses =
                expenses.findByUser_IdAndYearAndMonthOrderByEntryDateDesc(userId, year, month);

        BigDecimal totalInvestments =
                monthExpenses.stream()
                        .filter(e -> INVESTMENT_CATEGORY.equalsIgnoreCase(e.getCategory()))
                        .map(Expense::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenseOutflows =
                monthExpenses.stream()
                        .filter(e -> !INVESTMENT_CATEGORY.equalsIgnoreCase(e.getCategory()))
                        .map(Expense::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal balance = totalIncome.subtract(totalExpenseOutflows).subtract(totalInvestments);

        return new MonthlySummaryResponse(
                year, month, totalIncome, totalExpenseOutflows, totalInvestments, balance);
    }
}
