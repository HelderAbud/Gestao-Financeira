package com.hh.finance.service;

import com.hh.finance.domain.Income;
import com.hh.finance.domain.User;
import com.hh.finance.dto.IncomeDtos.IncomeCreateRequest;
import com.hh.finance.dto.IncomeDtos.IncomeResponse;
import com.hh.finance.repository.IncomeRepository;
import com.hh.finance.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IncomeService {

    private final IncomeRepository incomes;
    private final UserRepository users;

    public IncomeService(IncomeRepository incomes, UserRepository users) {
        this.incomes = incomes;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<IncomeResponse> list(long userId, Integer year, Integer month) {
        List<Income> list =
                year != null && month != null
                        ? incomes.findByUser_IdAndYearAndMonthOrderByEntryDateDesc(
                                userId, year, month)
                        : incomes.findByUser_IdOrderByEntryDateDesc(userId);
        return list.stream().map(IncomeResponse::from).toList();
    }

    @Transactional
    public IncomeResponse create(long userId, IncomeCreateRequest req) {
        User user = users.getReferenceById(userId);
        Income i = new Income();
        i.setUser(user);
        i.setDescription(req.description());
        i.setAmount(req.amount());
        i.setCategory(req.category());
        i.setMonth(req.month());
        i.setYear(req.year());
        i.setEntryDate(req.entryDate());
        i.setNotes(req.notes());
        return IncomeResponse.from(incomes.save(i));
    }

    @Transactional
    public IncomeResponse update(long userId, long id, IncomeCreateRequest req) {
        Income i =
                incomes
                        .findByIdAndUser_Id(id, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        i.setDescription(req.description());
        i.setAmount(req.amount());
        i.setCategory(req.category());
        i.setMonth(req.month());
        i.setYear(req.year());
        i.setEntryDate(req.entryDate());
        i.setNotes(req.notes());
        return IncomeResponse.from(incomes.save(i));
    }

    @Transactional
    public void delete(long userId, long id) {
        Income i =
                incomes
                        .findByIdAndUser_Id(id, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        incomes.delete(i);
    }
}
