package com.hh.finance.repository;

import com.hh.finance.domain.Expense;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUser_IdOrderByEntryDateDesc(Long userId);

    Optional<Expense> findByIdAndUser_Id(Long id, Long userId);

    List<Expense> findByUser_IdAndYearAndMonthOrderByEntryDateDesc(
            Long userId, Integer year, Integer month);
}
