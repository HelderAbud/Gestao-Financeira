package com.hh.finance.controller;

import com.hh.finance.dto.AuthDtos.LoginRequest;
import com.hh.finance.dto.AuthDtos.RegisterRequest;
import com.hh.finance.dto.AuthDtos.TokenResponse;
import com.hh.finance.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(
            summary = "Registo de utilizador",
            description = "Cria conta e devolve um JWT para uso nos endpoints protegidos.")
    @ApiResponses({
        @ApiResponse(
                responseCode = "200",
                description = "Conta criada; token JWT no corpo",
                content =
                        @Content(schema = @Schema(implementation = TokenResponse.class))),
        @ApiResponse(responseCode = "400", description = "Corpo inválido ou validação falhou"),
        @ApiResponse(responseCode = "409", description = "Email já cadastrado")
    })
    public TokenResponse register(@Valid @RequestBody RegisterRequest body) {
        return authService.register(body);
    }

    @PostMapping("/login")
    @Operation(
            summary = "Login",
            description = "Autentica com email e palavra-passe e devolve um JWT.")
    @ApiResponses({
        @ApiResponse(
                responseCode = "200",
                description = "Autenticação bem-sucedida",
                content =
                        @Content(schema = @Schema(implementation = TokenResponse.class))),
        @ApiResponse(responseCode = "400", description = "Corpo inválido ou validação falhou"),
        @ApiResponse(responseCode = "401", description = "Credenciais inválidas")
    })
    public TokenResponse login(@Valid @RequestBody LoginRequest body) {
        return authService.login(body);
    }
}
