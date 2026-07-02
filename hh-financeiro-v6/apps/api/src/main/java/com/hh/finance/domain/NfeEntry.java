package com.hh.finance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "nfe_entries")
@Getter
@Setter
@NoArgsConstructor
public class NfeEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "nfe_number", nullable = false, length = 50)
    private String nfeNumber;

    @Column(name = "supplier_name", length = 255)
    private String supplierName;

    @Column(name = "access_key", length = 80)
    private String accessKey;

    @Column(name = "raw_xml", nullable = false, columnDefinition = "TEXT")
    private String rawXml;

    @Column(name = "imported_at", nullable = false)
    private Instant importedAt = Instant.now();
}
