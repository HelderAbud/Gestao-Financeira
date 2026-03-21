package com.hh.finance.service;

import com.hh.finance.domain.User;
import com.hh.finance.dto.AuthDtos.LoginRequest;
import com.hh.finance.dto.AuthDtos.RegisterRequest;
import com.hh.finance.dto.AuthDtos.TokenResponse;
import com.hh.finance.dto.AuthDtos.UserMeResponse;
import com.hh.finance.repository.UserRepository;
import com.hh.finance.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public TokenResponse register(RegisterRequest req) {
        if (users.existsByEmailIgnoreCase(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }
        User u = new User();
        u.setEmail(req.email().trim().toLowerCase());
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        users.save(u);
        return new TokenResponse(jwtService.createToken(u.getId(), u.getEmail()));
    }

    public TokenResponse login(LoginRequest req) {
        User u =
                users.findByEmailIgnoreCase(req.email().trim().toLowerCase())
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.UNAUTHORIZED, "Credenciais inválidas"));
        if (!passwordEncoder.matches(req.password(), u.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
        }
        return new TokenResponse(jwtService.createToken(u.getId(), u.getEmail()));
    }

    public UserMeResponse me(long userId) {
        User u =
                users.findById(userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return new UserMeResponse(u.getId(), u.getEmail());
    }
}
