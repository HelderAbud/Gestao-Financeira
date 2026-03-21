package com.hh.finance.repository;

import com.hh.finance.domain.Goal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoalRepository extends JpaRepository<Goal, Long> {

    List<Goal> findByUser_IdOrderByIdDesc(Long userId);

    Optional<Goal> findByIdAndUser_Id(Long id, Long userId);
}
