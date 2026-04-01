package com.hh.finance.controller;

import com.hh.finance.dto.MonthlyInsightResponse;
import com.hh.finance.security.CurrentUser;
import com.hh.finance.service.SpendingInsightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/insights")
@Tag(name = "Insights")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class InsightController {

    private final SpendingInsightService spendingInsightService;

    public InsightController(SpendingInsightService spendingInsightService) {
        this.spendingInsightService = spendingInsightService;
    }

    @GetMapping("/monthly-analysis")
    @Operation(
            summary = "Análise textual do mês",
            description =
                    "Gera um texto com base no resumo financeiro do mês. Com `OPENAI_API_KEY`"
                            + " configurada, usa o modelo configurado em `hh.ai.model`."
                            + " Sem chave, devolve um resumo determinístico (`RULE_BASED`).")
    public MonthlyInsightResponse monthlyAnalysis(
            @RequestParam int year,
            @RequestParam @Min(1) @Max(12) int month) {
        return spendingInsightService.monthlyAnalysis(CurrentUser.id(), year, month);
    }
}
