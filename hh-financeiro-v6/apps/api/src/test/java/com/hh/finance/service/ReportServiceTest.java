package com.hh.finance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.hh.finance.domain.Expense;
import com.hh.finance.domain.Income;
import com.hh.finance.dto.MonthlySummaryResponse;
import com.hh.finance.repository.ExpenseRepository;
import com.hh.finance.repository.IncomeRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock private IncomeRepository incomes;
    @Mock private ExpenseRepository expenses;

    @InjectMocks private ReportService reportService;

    private static Income income(BigDecimal amount) {
        Income i = new Income();
        i.setAmount(amount);
        return i;
    }

    private static Expense expense(String category, BigDecimal amount) {
        Expense e = new Expense();
        e.setCategory(category);
        e.setAmount(amount);
        return e;
    }

    @Test
    void monthly_separatesInvestmentsFromOutflows() {
        when(incomes.findByUser_IdAndYearAndMonthOrderByEntryDateDesc(1L, 2025, 3))
                .thenReturn(List.of(income(new BigDecimal("1000.00"))));
        when(expenses.findByUser_IdAndYearAndMonthOrderByEntryDateDesc(1L, 2025, 3))
                .thenReturn(
                        List.of(
                                expense("Mercado", new BigDecimal("200.00")),
                                expense("Investimento", new BigDecimal("100.00"))));

        MonthlySummaryResponse r = reportService.monthly(1L, 2025, 3);

        assertThat(r.totalIncome()).isEqualByComparingTo("1000.00");
        assertThat(r.totalExpenseOutflows()).isEqualByComparingTo("200.00");
        assertThat(r.totalInvestments()).isEqualByComparingTo("100.00");
        assertThat(r.balance()).isEqualByComparingTo("700.00");
    }

    @Test
    void monthly_investmentCategoryIsCaseInsensitive() {
        when(expenses.findByUser_IdAndYearAndMonthOrderByEntryDateDesc(2L, 2025, 1))
                .thenReturn(List.of(expense("investimento", new BigDecimal("50.00"))));
        when(incomes.findByUser_IdAndYearAndMonthOrderByEntryDateDesc(2L, 2025, 1))
                .thenReturn(List.of());

        MonthlySummaryResponse r = reportService.monthly(2L, 2025, 1);

        assertThat(r.totalInvestments()).isEqualByComparingTo("50.00");
        assertThat(r.totalExpenseOutflows()).isEqualByComparingTo("0");
    }
}
