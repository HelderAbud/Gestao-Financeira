package com.hh.finance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hh.finance.domain.Budget;
import com.hh.finance.domain.User;
import com.hh.finance.dto.BudgetDtos.BudgetResponse;
import com.hh.finance.dto.BudgetDtos.BudgetUpsertRequest;
import com.hh.finance.repository.BudgetRepository;
import com.hh.finance.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock private BudgetRepository budgets;
    @Mock private UserRepository users;

    @InjectMocks private BudgetService budgetService;

    @Test
    void upsert_createsNewWhenNoExistingRow() {
        User user = new User();
        user.setId(1L);
        when(users.getReferenceById(1L)).thenReturn(user);
        when(budgets.findByUser_IdAndYearAndMonthAndCategory(1L, 2025, 3, "Moradia"))
                .thenReturn(Optional.empty());
        when(budgets.save(any(Budget.class)))
                .thenAnswer(
                        inv -> {
                            Budget b = inv.getArgument(0);
                            b.setId(100L);
                            return b;
                        });

        BudgetUpsertRequest req =
                new BudgetUpsertRequest(2025, 3, "Moradia", new BigDecimal("1500.00"));
        BudgetResponse res = budgetService.upsert(1L, req);

        assertThat(res.id()).isEqualTo(100L);
        assertThat(res.plannedAmount()).isEqualByComparingTo("1500.00");
        assertThat(res.category()).isEqualTo("Moradia");
    }

    @Test
    void upsert_updatesExistingRow() {
        User user = new User();
        user.setId(1L);
        Budget existing = new Budget();
        existing.setId(10L);
        existing.setUser(user);
        existing.setYear(2025);
        existing.setMonth(3);
        existing.setCategory("Moradia");
        existing.setPlannedAmount(new BigDecimal("1000.00"));

        when(users.getReferenceById(1L)).thenReturn(user);
        when(budgets.findByUser_IdAndYearAndMonthAndCategory(1L, 2025, 3, "Moradia"))
                .thenReturn(Optional.of(existing));
        when(budgets.save(existing)).thenReturn(existing);

        BudgetUpsertRequest req =
                new BudgetUpsertRequest(2025, 3, "Moradia", new BigDecimal("2000.00"));
        BudgetResponse res = budgetService.upsert(1L, req);

        assertThat(res.plannedAmount()).isEqualByComparingTo("2000.00");
        verify(budgets).save(existing);
    }

    @Test
    void delete_throwsWhenBudgetBelongsToAnotherUser() {
        User owner = new User();
        owner.setId(2L);
        Budget b = new Budget();
        b.setId(99L);
        b.setUser(owner);

        when(budgets.findById(99L)).thenReturn(Optional.of(b));

        assertThatThrownBy(() -> budgetService.delete(1L, 99L))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void list_returnsMappedRows() {
        User u = new User();
        u.setId(1L);
        Budget b = new Budget();
        b.setId(1L);
        b.setUser(u);
        b.setYear(2025);
        b.setMonth(1);
        b.setCategory("Lazer");
        b.setPlannedAmount(new BigDecimal("300.00"));

        when(budgets.findByUser_IdAndYearAndMonth(1L, 2025, 1)).thenReturn(List.of(b));

        List<BudgetResponse> rows = budgetService.list(1L, 2025, 1);

        assertThat(rows).hasSize(1);
        assertThat(rows.getFirst().category()).isEqualTo("Lazer");
    }
}
