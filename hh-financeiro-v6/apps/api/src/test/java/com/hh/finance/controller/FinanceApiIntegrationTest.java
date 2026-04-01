package com.hh.finance.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FinanceApiIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private String register(String email) throws Exception {
        String body =
                """
                {"email":"%s","password":"password123"}
                """
                        .formatted(email);
        MvcResult result =
                mockMvc.perform(
                                post("/api/v1/auth/register")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(body))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.accessToken").exists())
                        .andReturn();
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.get("accessToken").asText();
    }

    @Test
    void actuatorHealth_isOkWithoutAuth() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void unauthenticated_usersMe_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void register_thenMe_returnsUser() throws Exception {
        String email = "u-" + UUID.randomUUID() + "@test.com";
        String token = register(email);

        mockMvc.perform(
                        get("/api/v1/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void monthlySummary_reflectsIncomeAndExpenses() throws Exception {
        String email = "u-" + UUID.randomUUID() + "@test.com";
        String token = register(email);

        String incomeJson =
                """
                {
                  "description": "Salário",
                  "amount": 1000.00,
                  "category": "Trabalho",
                  "month": 3,
                  "year": 2025,
                  "entryDate": "2025-03-01",
                  "notes": null
                }
                """;
        mockMvc.perform(
                        post("/api/v1/incomes")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(incomeJson))
                .andExpect(status().isOk());

        String expenseOutJson =
                """
                {
                  "description": "Mercado",
                  "amount": 200.00,
                  "category": "Alimentação",
                  "expenseType": "VARIABLE",
                  "month": 3,
                  "year": 2025,
                  "entryDate": "2025-03-10",
                  "notes": null,
                  "subscriptionId": null
                }
                """;
        mockMvc.perform(
                        post("/api/v1/expenses")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(expenseOutJson))
                .andExpect(status().isOk());

        String expenseInvJson =
                """
                {
                  "description": "Tesouro",
                  "amount": 100.00,
                  "category": "Investimento",
                  "expenseType": "VARIABLE",
                  "month": 3,
                  "year": 2025,
                  "entryDate": "2025-03-15",
                  "notes": null,
                  "subscriptionId": null
                }
                """;
        mockMvc.perform(
                        post("/api/v1/expenses")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(expenseInvJson))
                .andExpect(status().isOk());

        String summary =
                mockMvc.perform(
                                get("/api/v1/reports/monthly-summary")
                                        .header("Authorization", "Bearer " + token)
                                        .param("year", "2025")
                                        .param("month", "3"))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();

        JsonNode s = objectMapper.readTree(summary);
        assertThat(s.get("totalIncome").decimalValue()).isEqualByComparingTo("1000.00");
        assertThat(s.get("totalExpenseOutflows").decimalValue()).isEqualByComparingTo("200.00");
        assertThat(s.get("totalInvestments").decimalValue()).isEqualByComparingTo("100.00");
        assertThat(s.get("balance").decimalValue()).isEqualByComparingTo("700.00");
    }

    @Test
    void register_duplicateEmail_returns409WithStandardBody() throws Exception {
        String email = "dup-" + UUID.randomUUID() + "@test.com";
        String body =
                """
                {"email":"%s","password":"password123"}
                """
                        .formatted(email);
        mockMvc.perform(
                        post("/api/v1/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(
                        post("/api/v1/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("Email já cadastrado"))
                .andExpect(jsonPath("$.path").value("/api/v1/auth/register"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void monthlyInsight_withoutOpenAi_returnsRuleBasedText() throws Exception {
        String email = "u-" + UUID.randomUUID() + "@test.com";
        String token = register(email);

        mockMvc.perform(
                        get("/api/v1/insights/monthly-analysis")
                                .header("Authorization", "Bearer " + token)
                                .param("year", "2025")
                                .param("month", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("RULE_BASED"))
                .andExpect(jsonPath("$.text").isString())
                .andExpect(jsonPath("$.text").isNotEmpty());
    }

    @Test
    void login_invalidPassword_returns401() throws Exception {
        String email = "login-" + UUID.randomUUID() + "@test.com";
        register(email);

        mockMvc.perform(
                        post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"email":"%s","password":"wrong-pass"}
                                        """
                                                .formatted(email)))
                .andExpect(status().isUnauthorized());
    }
}
