package com.hh.finance.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 128) String password) {}

    public record LoginRequest(
            @NotBlank @Email String email, @NotBlank String password) {}

    @Schema(description = "JWT access token")
    public record TokenResponse(String accessToken) {}

    public record UserMeResponse(long id, String email) {}
}
