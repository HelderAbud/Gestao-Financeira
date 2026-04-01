package com.hh.finance.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(description = "Formato padrão de erro da API")
public record ApiErrorResponse(
        @Schema(description = "Código curto do tipo de erro", example = "CONFLICT")
                String error,
        @Schema(description = "Mensagem legível") String message,
        @Schema(description = "Caminho da requisição") String path,
        @Schema(description = "Instante ISO-8601") Instant timestamp) {}
