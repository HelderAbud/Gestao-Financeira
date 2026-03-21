package com.hh.finance.repository;

import com.hh.finance.domain.Subscription;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByUser_IdOrderByIdDesc(Long userId);

    Optional<Subscription> findByIdAndUser_Id(Long id, Long userId);
}
