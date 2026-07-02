package com.hh.finance.repository;

import com.hh.finance.domain.NfeEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NfeEntryRepository extends JpaRepository<NfeEntry, Long> {}
