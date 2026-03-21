package com.hh.finance.service;

import com.hh.finance.domain.Subscription;
import com.hh.finance.domain.User;
import com.hh.finance.dto.SubscriptionDtos.SubscriptionCreateRequest;
import com.hh.finance.dto.SubscriptionDtos.SubscriptionResponse;
import com.hh.finance.repository.SubscriptionRepository;
import com.hh.finance.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptions;
    private final UserRepository users;

    public SubscriptionService(SubscriptionRepository subscriptions, UserRepository users) {
        this.subscriptions = subscriptions;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> list(long userId) {
        return subscriptions.findByUser_IdOrderByIdDesc(userId).stream()
                .map(SubscriptionResponse::from)
                .toList();
    }

    @Transactional
    public SubscriptionResponse create(long userId, SubscriptionCreateRequest req) {
        User user = users.getReferenceById(userId);
        Subscription s = new Subscription();
        s.setUser(user);
        s.setDescription(req.description());
        s.setAmount(req.amount());
        s.setCategory(req.category());
        return SubscriptionResponse.from(subscriptions.save(s));
    }

    @Transactional
    public SubscriptionResponse update(long userId, long id, SubscriptionCreateRequest req) {
        Subscription s =
                subscriptions
                        .findByIdAndUser_Id(id, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        s.setDescription(req.description());
        s.setAmount(req.amount());
        s.setCategory(req.category());
        return SubscriptionResponse.from(subscriptions.save(s));
    }

    @Transactional
    public void delete(long userId, long id) {
        Subscription s =
                subscriptions
                        .findByIdAndUser_Id(id, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        subscriptions.delete(s);
    }
}
