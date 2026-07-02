package com.hh.finance.repository;

import com.hh.finance.domain.Product;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByUser_IdOrderByNameAsc(Long userId);

    Optional<Product> findByIdAndUser_Id(Long id, Long userId);

    Optional<Product> findByUser_IdAndNameIgnoreCase(Long userId, String name);
}
