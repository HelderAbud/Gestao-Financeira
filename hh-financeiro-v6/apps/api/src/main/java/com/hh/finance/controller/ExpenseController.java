package com.hh.finance.controller;

import com.hh.finance.dto.ExpenseDtos.ExpenseCreateRequest;
import com.hh.finance.dto.ExpenseDtos.ExpenseResponse;
import com.hh.finance.security.CurrentUser;
import com.hh.finance.service.ExpenseService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/expenses")
@Tag(name = "Expenses")
@SecurityRequirement(name = "bearerAuth")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public List<ExpenseResponse> list(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return expenseService.list(CurrentUser.id(), year, month);
    }

    @PostMapping
    public ExpenseResponse create(@Valid @RequestBody ExpenseCreateRequest body) {
        return expenseService.create(CurrentUser.id(), body);
    }

    @PutMapping("/{id}")
    public ExpenseResponse update(
            @PathVariable long id, @Valid @RequestBody ExpenseCreateRequest body) {
        return expenseService.update(CurrentUser.id(), id, body);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable long id) {
        expenseService.delete(CurrentUser.id(), id);
    }
}
