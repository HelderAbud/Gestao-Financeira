package com.hh.finance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hh.finance.domain.Goal;
import com.hh.finance.domain.GoalDeposit;
import com.hh.finance.domain.User;
import com.hh.finance.dto.GoalDtos.GoalDepositRequest;
import com.hh.finance.repository.GoalDepositRepository;
import com.hh.finance.repository.GoalRepository;
import com.hh.finance.repository.UserRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GoalServiceTest {

    @Mock private GoalRepository goals;
    @Mock private GoalDepositRepository deposits;
    @Mock private UserRepository users;

    @InjectMocks private GoalService goalService;

    @Test
    void deposit_incrementsCurrentAmount() {
        User user = new User();
        user.setId(1L);

        Goal g = new Goal();
        g.setId(10L);
        g.setUser(user);
        g.setDescription("Viagem");
        g.setTargetAmount(new BigDecimal("5000.00"));
        g.setCurrentAmount(new BigDecimal("100.00"));

        when(goals.findByIdAndUser_Id(10L, 1L)).thenReturn(Optional.of(g));
        when(deposits.save(any(GoalDeposit.class)))
                .thenAnswer(
                        inv -> {
                            GoalDeposit d = inv.getArgument(0);
                            d.setId(99L);
                            return d;
                        });
        when(goals.save(any())).thenAnswer(inv -> inv.getArgument(0));

        goalService.deposit(1L, 10L, new GoalDepositRequest(new BigDecimal("50.00")));

        ArgumentCaptor<Goal> captor = ArgumentCaptor.forClass(Goal.class);
        verify(goals).save(captor.capture());
        assertThat(captor.getValue().getCurrentAmount()).isEqualByComparingTo("150.00");
    }
}
