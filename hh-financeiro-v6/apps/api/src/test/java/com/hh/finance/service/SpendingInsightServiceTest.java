package com.hh.finance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hh.finance.config.AiProperties;
import com.hh.finance.dto.InsightMode;
import com.hh.finance.dto.MonthlyInsightResponse;
import com.hh.finance.dto.MonthlySummaryResponse;
import com.hh.finance.repository.ExpenseRepository;
import java.math.BigDecimal;
import java.util.Collections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

@ExtendWith(MockitoExtension.class)
class SpendingInsightServiceTest {

    @Mock private ReportService reportService;
    @Mock private ExpenseRepository expenseRepository;
    @Mock private AiProperties aiProperties;
    @Mock private RestClient openAiRestClient;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private SpendingInsightService service;

    @BeforeEach
    void setUp() {
        service =
                new SpendingInsightService(
                        reportService, expenseRepository, aiProperties, openAiRestClient, objectMapper);
    }

    @Test
    void monthlyAnalysis_withoutApiKey_returnsRuleBased() {
        when(aiProperties.hasOpenAiKey()).thenReturn(false);
        when(reportService.monthly(eq(1L), eq(2025), eq(3)))
                .thenReturn(
                        new MonthlySummaryResponse(
                                2025,
                                3,
                                new BigDecimal("1000.00"),
                                new BigDecimal("200.00"),
                                new BigDecimal("100.00"),
                                new BigDecimal("700.00")));
        when(expenseRepository.findByUser_IdAndYearAndMonthOrderByEntryDateDesc(1L, 2025, 3))
                .thenReturn(Collections.emptyList());

        MonthlyInsightResponse r = service.monthlyAnalysis(1L, 2025, 3);

        assertThat(r.mode()).isEqualTo(InsightMode.RULE_BASED);
        assertThat(r.text()).contains("2025");
        assertThat(r.text()).contains("700");
    }
}
