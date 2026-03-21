package com.hh.finance.controller;

import com.hh.finance.dto.GoalDtos.GoalCreateRequest;
import com.hh.finance.dto.GoalDtos.GoalDepositRequest;
import com.hh.finance.dto.GoalDtos.GoalDepositResponse;
import com.hh.finance.dto.GoalDtos.GoalResponse;
import com.hh.finance.security.CurrentUser;
import com.hh.finance.service.GoalService;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/goals")
@Tag(name = "Goals")
@SecurityRequirement(name = "bearerAuth")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping
    public List<GoalResponse> list() {
        return goalService.list(CurrentUser.id());
    }

    @PostMapping
    public GoalResponse create(@Valid @RequestBody GoalCreateRequest body) {
        return goalService.create(CurrentUser.id(), body);
    }

    @PutMapping("/{id}")
    public GoalResponse update(@PathVariable long id, @Valid @RequestBody GoalCreateRequest body) {
        return goalService.update(CurrentUser.id(), id, body);
    }

    @PostMapping("/{id}/deposits")
    public GoalDepositResponse deposit(
            @PathVariable long id, @Valid @RequestBody GoalDepositRequest body) {
        return goalService.deposit(CurrentUser.id(), id, body);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable long id) {
        goalService.delete(CurrentUser.id(), id);
    }
}
