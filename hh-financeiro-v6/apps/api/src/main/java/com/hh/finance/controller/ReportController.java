package com.hh.finance.controller;

import com.hh.finance.dto.MonthlySummaryResponse;
import com.hh.finance.security.CurrentUser;
import com.hh.finance.service.ReportService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
    public MonthlySummaryResponse monthlySummary(
            @RequestParam int year,
            @RequestParam @jakarta.validation.constraints.Min(1)
                    @jakarta.validation.constraints.Max(12) int month) {
        return reportService.monthly(CurrentUser.id(), year, month);
    }
}
