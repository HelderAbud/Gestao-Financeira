package com.hh.finance.dto;

import com.hh.finance.domain.Goal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public final class GoalDtos {

    private GoalDtos() {}

    public record GoalCreateRequest(
            @NotBlank @Size(max = 512) String description,
            @NotNull @DecimalMin("0.01") BigDecimal targetAmount) {}

    public record GoalResponse(
            long id,
            String description,
            BigDecimal targetAmount,
            BigDecimal currentAmount) {

        public static GoalResponse from(Goal g) {
            return new GoalResponse(
                    g.getId(), g.getDescription(), g.getTargetAmount(), g.getCurrentAmount());
        }
    }

    public record GoalDepositRequest(@NotNull @DecimalMin("0.01") BigDecimal amount) {}

    public record GoalDepositResponse(long id, BigDecimal amount, Instant recordedAt) {}
}
