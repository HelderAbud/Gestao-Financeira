package com.hh.finance.repository;

import com.hh.finance.domain.Budget;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUser_IdAndYearAndMonth(Long userId, Integer year, Integer month);

    Optional<Budget> findByUser_IdAndYearAndMonthAndCategory(
            Long userId, Integer year, Integer month, String category);
}
