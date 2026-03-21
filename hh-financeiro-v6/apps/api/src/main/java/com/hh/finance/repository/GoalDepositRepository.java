package com.hh.finance.repository;

import com.hh.finance.domain.GoalDeposit;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoalDepositRepository extends JpaRepository<GoalDeposit, Long> {

    List<GoalDeposit> findByGoal_IdOrderByRecordedAtDesc(Long goalId);
}
