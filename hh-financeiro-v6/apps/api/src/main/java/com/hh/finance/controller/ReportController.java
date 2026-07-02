package com.hh.finance.controller;

import com.hh.finance.dto.MonthlySummaryResponse;
import com.hh.finance.security.CurrentUser;
import com.hh.finance.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Reports")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/monthly-summary")
    @Operation(
            summary = "Resumo financeiro do mês",
            description =
                    "Devolve agregados do mês indicado (receitas, despesas, metas, orçamentos, etc.)"
                            + " para o utilizador autenticado.")
    public MonthlySummaryResponse monthlySummary(
            @RequestParam
                    @Parameter(description = "Ano civil (ex.: 2026)", example = "2026")
                    int year,
            @RequestParam @Min(1) @Max(12)
                    @Parameter(description = "Mês (1–12)", example = "4")
                    int month) {
        return reportService.monthly(CurrentUser.id(), year, month);
    }
}
