package com.hh.finance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hh.finance.domain.Subscription;
import com.hh.finance.domain.User;
import com.hh.finance.dto.SubscriptionDtos.SubscriptionCreateRequest;
import com.hh.finance.dto.SubscriptionDtos.SubscriptionResponse;
import com.hh.finance.repository.SubscriptionRepository;
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
class SubscriptionServiceTest {

    @Mock private SubscriptionRepository subscriptions;
    @Mock private UserRepository users;

    @InjectMocks private SubscriptionService subscriptionService;

    @Test
    void create_persistsAndReturnsResponse() {
        User user = new User();
        user.setId(1L);
        when(users.getReferenceById(1L)).thenReturn(user);
        when(subscriptions.save(any(Subscription.class)))
                .thenAnswer(
                        inv -> {
                            Subscription s = inv.getArgument(0);
                            s.setId(50L);
                            return s;
                        });

        SubscriptionCreateRequest req =
                new SubscriptionCreateRequest(
                        "Netflix", new BigDecimal("39.90"), "Streaming");
        SubscriptionResponse res = subscriptionService.create(1L, req);

        assertThat(res.id()).isEqualTo(50L);
        assertThat(res.description()).isEqualTo("Netflix");
        assertThat(res.amount()).isEqualByComparingTo("39.90");
    }

    @Test
    void update_throwsWhenNotFound() {
        when(subscriptions.findByIdAndUser_Id(99L, 1L)).thenReturn(Optional.empty());

        SubscriptionCreateRequest req =
                new SubscriptionCreateRequest("X", new BigDecimal("10.00"), "Y");

        assertThatThrownBy(() -> subscriptionService.update(1L, 99L, req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void delete_throwsWhenNotFound() {
        when(subscriptions.findByIdAndUser_Id(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> subscriptionService.delete(1L, 99L))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void update_updatesFields() {
        User user = new User();
        user.setId(1L);
        Subscription s = new Subscription();
        s.setId(10L);
        s.setUser(user);
        s.setDescription("Old");
        s.setAmount(new BigDecimal("10.00"));
        s.setCategory("OldCat");

        when(subscriptions.findByIdAndUser_Id(10L, 1L)).thenReturn(Optional.of(s));
        when(subscriptions.save(s)).thenReturn(s);

        SubscriptionCreateRequest req =
                new SubscriptionCreateRequest("New", new BigDecimal("20.00"), "NewCat");
        SubscriptionResponse res = subscriptionService.update(1L, 10L, req);

        assertThat(res.description()).isEqualTo("New");
        assertThat(res.amount()).isEqualByComparingTo("20.00");
        assertThat(res.category()).isEqualTo("NewCat");
    }

    @Test
    void list_returnsOrderedByService() {
        when(subscriptions.findByUser_IdOrderByIdDesc(1L)).thenReturn(List.of());

        assertThat(subscriptionService.list(1L)).isEmpty();
        verify(subscriptions).findByUser_IdOrderByIdDesc(1L);
    }
}
