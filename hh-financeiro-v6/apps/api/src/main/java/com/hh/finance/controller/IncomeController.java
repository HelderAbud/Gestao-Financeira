package com.hh.finance.controller;

import com.hh.finance.dto.IncomeDtos.IncomeCreateRequest;
import com.hh.finance.dto.IncomeDtos.IncomeResponse;
import com.hh.finance.security.CurrentUser;
import com.hh.finance.service.IncomeService;
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
@RequestMapping("/api/v1/incomes")
@Tag(name = "Incomes")
@SecurityRequirement(name = "bearerAuth")
public class IncomeController {

    private final IncomeService incomeService;

    public IncomeController(IncomeService incomeService) {
        this.incomeService = incomeService;
    }

    @GetMapping
    public List<IncomeResponse> list(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return incomeService.list(CurrentUser.id(), year, month);
    }

    @PostMapping
    public IncomeResponse create(@Valid @RequestBody IncomeCreateRequest body) {
        return incomeService.create(CurrentUser.id(), body);
    }

    @PutMapping("/{id}")
    public IncomeResponse update(
            @PathVariable long id, @Valid @RequestBody IncomeCreateRequest body) {
        return incomeService.update(CurrentUser.id(), id, body);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable long id) {
        incomeService.delete(CurrentUser.id(), id);
    }
}
