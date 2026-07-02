package com.hh.finance.openapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Garante que a documentação OpenAPI expõe os textos acordados para Auth e Reports (checklist A1).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OpenApiDocumentationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void v3ApiDocs_includesEnrichedAuthAndReportsOperations() throws Exception {
        MvcResult result = mockMvc.perform(get("/v3/api-docs")).andExpect(status().isOk()).andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode paths = root.get("paths");
        assertThat(paths).isNotNull();

        JsonNode register = paths.get("/api/v1/auth/register").get("post");
        assertThat(register.get("summary").asText()).isEqualTo("Registo de utilizador");
        assertThat(register.get("description").asText()).contains("JWT");
        assertThat(register.get("responses").has("200")).isTrue();
        assertThat(register.get("responses").has("400")).isTrue();
        assertThat(register.get("responses").has("409")).isTrue();

        JsonNode login = paths.get("/api/v1/auth/login").get("post");
        assertThat(login.get("summary").asText()).isEqualTo("Login");
        assertThat(login.get("responses").has("200")).isTrue();
        assertThat(login.get("responses").has("401")).isTrue();

        JsonNode monthly = paths.get("/api/v1/reports/monthly-summary").get("get");
        assertThat(monthly.get("summary").asText()).isEqualTo("Resumo financeiro do mês");
        assertThat(monthly.get("description").asText()).contains("agregados");

        JsonNode params = monthly.get("parameters");
        assertThat(params).isNotNull();
        assertThat(params.toString()).contains("Ano civil");
        assertThat(params.toString()).contains("Mês (1–12)");
    }
}
