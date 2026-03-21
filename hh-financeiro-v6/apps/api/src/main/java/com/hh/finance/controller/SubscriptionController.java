package com.hh.finance.controller;

import com.hh.finance.dto.SubscriptionDtos.SubscriptionCreateRequest;
import com.hh.finance.dto.SubscriptionDtos.SubscriptionResponse;
import com.hh.finance.security.CurrentUser;
import com.hh.finance.service.SubscriptionService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/subscriptions")
@Tag(name = "Subscriptions")
@SecurityRequirement(name = "bearerAuth")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public List<SubscriptionResponse> list() {
        return subscriptionService.list(CurrentUser.id());
    }

    @PostMapping
    public SubscriptionResponse create(@Valid @RequestBody SubscriptionCreateRequest body) {
        return subscriptionService.create(CurrentUser.id(), body);
    }

    @PutMapping("/{id}")
    public SubscriptionResponse update(
            @PathVariable long id, @Valid @RequestBody SubscriptionCreateRequest body) {
        return subscriptionService.update(CurrentUser.id(), id, body);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable long id) {
        subscriptionService.delete(CurrentUser.id(), id);
    }
}
