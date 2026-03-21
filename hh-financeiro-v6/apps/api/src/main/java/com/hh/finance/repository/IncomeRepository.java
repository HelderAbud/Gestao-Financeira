package com.hh.finance.repository;

import com.hh.finance.domain.Income;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncomeRepository extends JpaRepository<Income, Long> {

    List<Income> findByUser_IdOrderByEntryDateDesc(Long userId);

    Optional<Income> findByIdAndUser_Id(Long id, Long userId);

    List<Income> findByUser_IdAndYearAndMonthOrderByEntryDateDesc(
            Long userId, Integer year, Integer month);
}
