package com.hh.finance.service;

import com.hh.finance.domain.Budget;
import com.hh.finance.domain.User;
import com.hh.finance.dto.BudgetDtos.BudgetResponse;
import com.hh.finance.dto.BudgetDtos.BudgetUpsertRequest;
import com.hh.finance.repository.BudgetRepository;
import com.hh.finance.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BudgetService {

    private final BudgetRepository budgets;
    private final UserRepository users;

    public BudgetService(BudgetRepository budgets, UserRepository users) {
        this.budgets = budgets;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> list(long userId, int year, int month) {
        return budgets.findByUser_IdAndYearAndMonth(userId, year, month).stream()
                .map(BudgetResponse::from)
                .toList();
    }

    @Transactional
    public BudgetResponse upsert(long userId, BudgetUpsertRequest req) {
        User user = users.getReferenceById(userId);
        Budget b =
                budgets
                        .findByUser_IdAndYearAndMonthAndCategory(
                                userId, req.year(), req.month(), req.category())
                        .orElseGet(Budget::new);
        b.setUser(user);
        b.setYear(req.year());
        b.setMonth(req.month());
        b.setCategory(req.category());
        b.setPlannedAmount(req.plannedAmount());
        return BudgetResponse.from(budgets.save(b));
    }

    @Transactional
    public void delete(long userId, long id) {
        Budget b =
                budgets
                        .findById(id)
                        .filter(x -> x.getUser().getId().equals(userId))
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        budgets.delete(b);
    }
}
