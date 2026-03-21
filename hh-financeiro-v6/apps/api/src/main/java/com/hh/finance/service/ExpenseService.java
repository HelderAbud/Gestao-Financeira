package com.hh.finance.service;

import com.hh.finance.domain.Expense;
import com.hh.finance.domain.Subscription;
import com.hh.finance.domain.User;
import com.hh.finance.dto.ExpenseDtos.ExpenseCreateRequest;
import com.hh.finance.dto.ExpenseDtos.ExpenseResponse;
import com.hh.finance.repository.ExpenseRepository;
import com.hh.finance.repository.SubscriptionRepository;
import com.hh.finance.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ExpenseService {

    private final ExpenseRepository expenses;
    private final UserRepository users;
    private final SubscriptionRepository subscriptions;

    public ExpenseService(
            ExpenseRepository expenses,
            UserRepository users,
            SubscriptionRepository subscriptions) {
        this.expenses = expenses;
        this.users = users;
        this.subscriptions = subscriptions;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> list(long userId, Integer year, Integer month) {
        List<Expense> list =
                year != null && month != null
                        ? expenses.findByUser_IdAndYearAndMonthOrderByEntryDateDesc(
                                userId, year, month)
                        : expenses.findByUser_IdOrderByEntryDateDesc(userId);
        return list.stream().map(ExpenseResponse::from).toList();
    }

    @Transactional
    public ExpenseResponse create(long userId, ExpenseCreateRequest req) {
        User user = users.getReferenceById(userId);
        Expense e = new Expense();
        e.setUser(user);
        e.setDescription(req.description());
        e.setAmount(req.amount());
        e.setCategory(req.category());
        e.setExpenseType(req.expenseType());
        e.setMonth(req.month());
        e.setYear(req.year());
        e.setEntryDate(req.entryDate());
        e.setNotes(req.notes());
        if (req.subscriptionId() != null) {
            Subscription sub =
                    subscriptions
                            .findByIdAndUser_Id(req.subscriptionId(), userId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            e.setSubscription(sub);
        }
        return ExpenseResponse.from(expenses.save(e));
    }

    @Transactional
    public ExpenseResponse update(long userId, long id, ExpenseCreateRequest req) {
        Expense e =
                expenses
                        .findByIdAndUser_Id(id, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        e.setDescription(req.description());
        e.setAmount(req.amount());
        e.setCategory(req.category());
        e.setExpenseType(req.expenseType());
        e.setMonth(req.month());
        e.setYear(req.year());
        e.setEntryDate(req.entryDate());
        e.setNotes(req.notes());
        if (req.subscriptionId() != null) {
            Subscription sub =
                    subscriptions
                            .findByIdAndUser_Id(req.subscriptionId(), userId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            e.setSubscription(sub);
        } else {
            e.setSubscription(null);
        }
        return ExpenseResponse.from(expenses.save(e));
    }

    @Transactional
    public void delete(long userId, long id) {
        Expense e =
                expenses
                        .findByIdAndUser_Id(id, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        expenses.delete(e);
    }
}
