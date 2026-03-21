package com.hh.finance.dto;

import com.hh.finance.domain.Subscription;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public final class SubscriptionDtos {

    private SubscriptionDtos() {}

    public record SubscriptionCreateRequest(
            @NotBlank @Size(max = 512) String description,
            @NotNull @DecimalMin("0.01") BigDecimal amount,
            @NotBlank @Size(max = 100) String category) {}

    public record SubscriptionResponse(long id, String description, BigDecimal amount, String category) {

        public static SubscriptionResponse from(Subscription s) {
            return new SubscriptionResponse(
                    s.getId(), s.getDescription(), s.getAmount(), s.getCategory());
        }
    }
}
