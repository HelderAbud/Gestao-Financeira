package com.hh.finance.repository;

import com.hh.finance.domain.Sale;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByUser_IdAndSoldAtBetween(Long userId, Instant from, Instant to);
}
