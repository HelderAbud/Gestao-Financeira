package com.hh.finance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hh.finance.domain.User;
import com.hh.finance.dto.AuthDtos.RegisterRequest;
import com.hh.finance.dto.AuthDtos.TokenResponse;
import com.hh.finance.repository.UserRepository;
import com.hh.finance.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository users;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;

    @InjectMocks private AuthService authService;

    @Test
    void register_rejectsDuplicateEmail() {
        when(users.existsByEmailIgnoreCase("a@b.com")).thenReturn(true);

        assertThatThrownBy(
                        () ->
                                authService.register(
                                        new RegisterRequest("a@b.com", "password123")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(users, never()).save(any());
    }

    @Test
    void register_persistsUserAndReturnsToken() {
        when(users.existsByEmailIgnoreCase("new@b.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hash");
        when(users.save(any(User.class)))
                .thenAnswer(
                        inv -> {
                            User u = inv.getArgument(0);
                            u.setId(42L);
                            return u;
                        });
        when(jwtService.createToken(42L, "new@b.com")).thenReturn("jwt-token");

        TokenResponse res = authService.register(new RegisterRequest("new@b.com", "password123"));

        assertThat(res.accessToken()).isEqualTo("jwt-token");
        verify(users).save(any(User.class));
    }
}
