package com.hh.finance.controller;

import com.hh.finance.dto.BudgetDtos.BudgetResponse;
import com.hh.finance.dto.BudgetDtos.BudgetUpsertRequest;
import com.hh.finance.security.CurrentUser;
import com.hh.finance.service.BudgetService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/budgets")
@Tag(name = "Budgets")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public List<BudgetResponse> list(
            @RequestParam int year, @RequestParam @jakarta.validation.constraints.Min(1)
                    @jakarta.validation.constraints.Max(12) int month) {
        return budgetService.list(CurrentUser.id(), year, month);
    }

    @PostMapping
    public BudgetResponse upsert(@Valid @RequestBody BudgetUpsertRequest body) {
        return budgetService.upsert(CurrentUser.id(), body);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable long id) {
        budgetService.delete(CurrentUser.id(), id);
    }
}
