package com.hh.finance.service;

import com.hh.finance.domain.Goal;
import com.hh.finance.domain.GoalDeposit;
import com.hh.finance.domain.User;
import com.hh.finance.dto.GoalDtos.GoalCreateRequest;
import com.hh.finance.dto.GoalDtos.GoalDepositRequest;
import com.hh.finance.dto.GoalDtos.GoalDepositResponse;
import com.hh.finance.dto.GoalDtos.GoalResponse;
import com.hh.finance.repository.GoalDepositRepository;
import com.hh.finance.repository.GoalRepository;
import com.hh.finance.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoalService {

    private final GoalRepository goals;
    private final GoalDepositRepository deposits;
    private final UserRepository users;

    public GoalService(
            GoalRepository goals, GoalDepositRepository deposits, UserRepository users) {
        this.goals = goals;
        this.deposits = deposits;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> list(long userId) {
        return goals.findByUser_IdOrderByIdDesc(userId).stream().map(GoalResponse::from).toList();
    }

    @Transactional
    public GoalResponse create(long userId, GoalCreateRequest req) {
        User user = users.getReferenceById(userId);
        Goal g = new Goal();
        g.setUser(user);
        g.setDescription(req.description());
        g.setTargetAmount(req.targetAmount());
        g.setCurrentAmount(java.math.BigDecimal.ZERO);
        return GoalResponse.from(goals.save(g));
    }

    @Transactional
    public GoalResponse update(long userId, long id, GoalCreateRequest req) {
        Goal g =
                goals
                        .findByIdAndUser_Id(id, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        g.setDescription(req.description());
        g.setTargetAmount(req.targetAmount());
        return GoalResponse.from(goals.save(g));
    }

    @Transactional
    public GoalDepositResponse deposit(long userId, long goalId, GoalDepositRequest req) {
        Goal g =
                goals
                        .findByIdAndUser_Id(goalId, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        GoalDeposit d = new GoalDeposit();
        d.setGoal(g);
        d.setAmount(req.amount());
        deposits.save(d);
        g.setCurrentAmount(g.getCurrentAmount().add(req.amount()));
        goals.save(g);
        return new GoalDepositResponse(d.getId(), d.getAmount(), d.getRecordedAt());
    }

    @Transactional
    public void delete(long userId, long id) {
        Goal g =
                goals
                        .findByIdAndUser_Id(id, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        goals.delete(g);
    }
}
