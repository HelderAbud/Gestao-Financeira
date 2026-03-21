package com.hh.finance.repository;

import com.hh.finance.domain.SubscriptionProcessed;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionProcessedRepository extends JpaRepository<SubscriptionProcessed, Long> {

    boolean existsBySubscription_IdAndYearAndMonth(Long subscriptionId, Integer year, Integer month);

    Optional<SubscriptionProcessed> findBySubscription_IdAndYearAndMonth(
            Long subscriptionId, Integer year, Integer month);
}
