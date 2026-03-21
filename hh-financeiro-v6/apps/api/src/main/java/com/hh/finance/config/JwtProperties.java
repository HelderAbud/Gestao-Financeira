package com.hh.finance.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "hh.jwt")
public record JwtProperties(String secret, long expirationMs) {}
