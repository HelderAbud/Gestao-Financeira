package com.hh.finance.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hh.finance.config.AiProperties;
import com.hh.finance.domain.Expense;
import com.hh.finance.dto.InsightMode;
import com.hh.finance.dto.MonthlyInsightResponse;
import com.hh.finance.dto.MonthlySummaryResponse;
import com.hh.finance.repository.ExpenseRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
public class SpendingInsightService {

    private static final Logger log = LoggerFactory.getLogger(SpendingInsightService.class);
    private static final String INVESTMENT_CATEGORY = "Investimento";

    private final ReportService reportService;
    private final ExpenseRepository expenseRepository;
    private final AiProperties aiProperties;
    private final RestClient openAiRestClient;
    private final ObjectMapper objectMapper;

    public SpendingInsightService(
            ReportService reportService,
            ExpenseRepository expenseRepository,
            AiProperties aiProperties,
            RestClient openAiRestClient,
            ObjectMapper objectMapper) {
        this.reportService = reportService;
        this.expenseRepository = expenseRepository;
        this.aiProperties = aiProperties;
        this.openAiRestClient = openAiRestClient;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public MonthlyInsightResponse monthlyAnalysis(long userId, int year, int month) {
        MonthlySummaryResponse summary = reportService.monthly(userId, year, month);
        Map<String, BigDecimal> categoryTotals = aggregateExpenseByCategory(userId, year, month);

        if (!aiProperties.hasOpenAiKey()) {
            return new MonthlyInsightResponse(
                    buildRuleBasedText(summary, categoryTotals), InsightMode.RULE_BASED);
        }

        try {
            String prompt = buildUserPrompt(summary, categoryTotals);
            String completion = callOpenAi(prompt);
            if (completion == null || completion.isBlank()) {
                return new MonthlyInsightResponse(
                        buildRuleBasedText(summary, categoryTotals), InsightMode.RULE_BASED);
            }
            return new MonthlyInsightResponse(completion.trim(), InsightMode.OPENAI);
        } catch (Exception e) {
            log.warn("Falha ao obter análise via OpenAI; a usar resumo baseado em regras.", e);
            return new MonthlyInsightResponse(
                    buildRuleBasedText(summary, categoryTotals), InsightMode.RULE_BASED);
        }
    }

    private Map<String, BigDecimal> aggregateExpenseByCategory(
            long userId, int year, int month) {
        List<Expense> rows =
                expenseRepository.findByUser_IdAndYearAndMonthOrderByEntryDateDesc(
                        userId, year, month);
        Map<String, BigDecimal> map = new LinkedHashMap<>();
        for (Expense e : rows) {
            if (INVESTMENT_CATEGORY.equalsIgnoreCase(e.getCategory())) {
                continue;
            }
            String cat = e.getCategory() != null ? e.getCategory() : "Outros";
            map.merge(cat, e.getAmount(), BigDecimal::add);
        }
        return map;
    }

    private String buildUserPrompt(
            MonthlySummaryResponse s, Map<String, BigDecimal> categoryTotals) {
        StringBuilder sb = new StringBuilder();
        sb.append("Dados do mês ")
                .append(s.month())
                .append("/")
                .append(s.year())
                .append(":\n");
        sb.append("- Total receitas: ")
                .append(s.totalIncome().setScale(2, RoundingMode.HALF_UP))
                .append("\n");
        sb.append("- Saídas (sem investimento): ")
                .append(s.totalExpenseOutflows().setScale(2, RoundingMode.HALF_UP))
                .append("\n");
        sb.append("- Investimentos registados como despesa: ")
                .append(s.totalInvestments().setScale(2, RoundingMode.HALF_UP))
                .append("\n");
        sb.append("- Saldo (receitas - saídas - investimentos): ")
                .append(s.balance().setScale(2, RoundingMode.HALF_UP))
                .append("\n");
        if (!categoryTotals.isEmpty()) {
            sb.append("Despesas por categoria (excl. Investimento):\n");
            categoryTotals.entrySet().stream()
                    .sorted(Comparator.<Map.Entry<String, BigDecimal>, BigDecimal>comparing(
                                    Map.Entry::getValue)
                            .reversed())
                    .limit(8)
                    .forEach(
                            e ->
                                    sb.append("  - ")
                                            .append(e.getKey())
                                            .append(": ")
                                            .append(
                                                    e.getValue()
                                                            .setScale(2, RoundingMode.HALF_UP))
                                            .append("\n"));
        }
        sb.append(
                "\nEscreve 2 parágrafos curtos em português: (1) leitura do mês e (2) até 3 sugestões práticas. "
                        + "Não inventes valores. Não prometas rentabilidade.");
        return sb.toString();
    }

    private String buildRuleBasedText(
            MonthlySummaryResponse s, Map<String, BigDecimal> categoryTotals) {
        StringBuilder sb = new StringBuilder();
        sb.append("No mês ")
                .append(s.month())
                .append("/")
                .append(s.year())
                .append(", as receitas totalizaram ")
                .append(formatMoney(s.totalIncome()))
                .append(" e as saídas (sem investimento) ")
                .append(formatMoney(s.totalExpenseOutflows()))
                .append(". ");
        sb.append("Registou ")
                .append(formatMoney(s.totalInvestments()))
                .append(" em investimento e o saldo do período é ")
                .append(formatMoney(s.balance()))
                .append(". ");
        if (categoryTotals.isEmpty()) {
            sb.append("Não há despesas por categoria neste mês para detalhar.");
        } else {
            String top =
                    categoryTotals.entrySet().stream()
                            .sorted(
                                    Comparator.<Map.Entry<String, BigDecimal>, BigDecimal>comparing(
                                                    Map.Entry::getValue)
                                            .reversed())
                            .limit(3)
                            .map(e -> e.getKey() + " (" + formatMoney(e.getValue()) + ")")
                            .collect(Collectors.joining(", "));
            sb.append("As maiores rubricas de despesa foram: ").append(top).append(". ");
            sb.append(
                    "Sugestão: reveja orçamentos nessas categorias e mantenha o registo semanal para comparar com o mês seguinte.");
        }
        return sb.toString();
    }

    private static String formatMoney(BigDecimal v) {
        return v == null ? "0,00 €" : v.setScale(2, RoundingMode.HALF_UP) + " €";
    }

    private String callOpenAi(String userContent) throws java.io.IOException {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", aiProperties.getModel());
        root.put("temperature", 0.35);
        root.put("max_tokens", 600);
        ArrayNode messages = root.putArray("messages");
        ObjectNode sys = messages.addObject();
        sys.put("role", "system");
        sys.put(
                "content",
                "És um assistente de finanças pessoais. Responde só com base nos números"
                        + " fornecidos. Português. Sem jargão de investimento arriscado.");
        ObjectNode user = messages.addObject();
        user.put("role", "user");
        user.put("content", userContent);

        String json = objectMapper.writeValueAsString(root);

        String responseBody =
                openAiRestClient
                        .post()
                        .uri("/v1/chat/completions")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + aiProperties.getOpenaiApiKey())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(json)
                        .retrieve()
                        .body(String.class);

        if (responseBody == null) {
            return null;
        }
        JsonNode tree = objectMapper.readTree(responseBody);
        JsonNode content =
                tree.path("choices").path(0).path("message").path("content");
        return content.isMissingNode() ? null : content.asText();
    }
}
