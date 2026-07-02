package com.hh.finance.repository;

import com.hh.finance.domain.InventoryBalance;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, Long> {

    Optional<InventoryBalance> findByUser_IdAndProduct_Id(Long userId, Long productId);

    List<InventoryBalance> findByUser_IdAndQuantityLessThanOrderByQuantityAsc(Long userId, java.math.BigDecimal quantity);
}
