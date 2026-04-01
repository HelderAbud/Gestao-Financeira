# Plano “Gestão Financeira + IA + deploy” vs. o que o código já faz

Este ficheiro cruza o **plano em fases** (recrutador / roadmap) com o estado actual do **`hh-financeiro-v6`**.  
Use como checklist: o que já está **feito**, o que é **equivalente** com outro nome, e o que **falta** de verdade.

**Legenda:** ✅ já coberto · 🟡 parcial / equivalente · ❌ não existe ainda

---

## FASE 1 — Base profissional

| Passo | Plano original | Estado no projeto |
|-------|----------------|-------------------|
| 1 | Camadas controller / service / repository / DTO | ✅ Padrão em `com.hh.finance` |
| 1 | Não aceder repository no controller | ✅ Controllers usam *Services* |
| 2 | `@ControllerAdvice` + erros JSON | ✅ `GlobalExceptionHandler` + `ApiErrorResponse` |
| 3 | Validação `@NotNull`, `@NotBlank`, `@Positive` | 🟡 Presente em vários DTOs; vale **rever** todos os requests |
| 4 | Swagger: descrições, exemplos, tags | 🟡 Springdoc + `@Tag`; pode **enriquecer** `@Operation` / exemplos |

**Nota:** Os endpoints são versionados: **`/api/v1/...`**, não `/auth/...` solto.

---

## FASE 2 — Segurança

| Passo | Plano original | Estado no projeto |
|-------|----------------|-------------------|
| 5 | Login + registo + JWT | ✅ `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, filtro JWT |
| 6 | Utilizador só vê os próprios dados | ✅ Serviços usam `CurrentUser.id()` para isolar por utilizador |

---

## FASE 3 — Regra de negócio

| Passo | Plano original | Estado no projeto |
|-------|----------------|-------------------|
| 7 | Categorias (Alimentação, Transporte…) | 🟡 **Categoria é texto** nas despesas/receitas/orçamentos (flexível). Não há tabela `Category` nem seed fixo — pode ser **melhoria futura** se quiseres catálogo fechado |
| 8 | Relatório mensal (totais, saldo) | ✅ `GET /api/v1/reports/monthly-summary?year=&month=` → `MonthlySummaryResponse` |
| 9 | Filtro por período | 🟡 Despesas/receitas: **`year` + `month`**. Não há `?inicio=…&fim=…` em intervalo arbitrário — **melhoria opcional** |

---

## FASE 4 — IA

| Passo | Plano original | Estado no projeto |
|-------|----------------|-------------------|
| 10 | Análise textual do mês (IA opcional) | ✅ `GET /api/v1/insights/monthly-analysis` — `OPENAI_API_KEY` + `hh.ai.model`; sem chave, modo `RULE_BASED` |

**Nota:** implementação em `SpendingInsightService` + `InsightController`; configuração `hh.ai` em `application.yml`.

---

## FASE 5 — Deploy

| Passo | Plano original | Estado no projeto |
|-------|----------------|-------------------|
| 11–12 | PostgreSQL + API no Render/Railway | 🟡 Documentado em **[DEPLOY.md](DEPLOY.md)**; **URL real** ainda depende de **tu** publicares e colocares no README |
| 13 | Swagger online | 🟡 Mesmo: após deploy, link tipo `…/swagger-ui.html` |

---

## FASE 6 — Testes

| Passo | Plano original | Estado no projeto |
|-------|----------------|-------------------|
| 14 | Pelo menos 1 teste de service | ✅ Vários (ex.: `ReportServiceTest`, `BudgetServiceTest`, …) + integração em `FinanceApiIntegrationTest` |

---

## FASE 7 — README

| Passo | Plano original | Estado no projeto |
|-------|----------------|-------------------|
| 15 | README com stack, como rodar, deploy | 🟡 **[README.md](../README.md)** já é forte; falta **substituir placeholders** de demo por links reais quando existirem |

---

## FASE 8 — GitHub

| Passo | Plano original | Estado no projeto |
|-------|----------------|-------------------|
| 16 | Fixar 3 repos | 🔧 Ação **manual** no perfil GitHub (Gestão Financeira, Tshirt-Store, Camera Escolar) |
| 17 | README do perfil | 🔧 Repo `HelderAbud/HelderAbud` — ver `workspace/HelderAbud-github-profile-README.md` |

---

## FASE 9 — LinkedIn

| Passo | Plano original | Estado no projeto |
|-------|----------------|-------------------|
| 18 | Post com link do projeto | 🔧 Manual; use o bloco **“Resumo para LinkedIn”** no README da raiz |

---

## Checklist final do teu plano (honesto)

| Critério | Situação |
|----------|----------|
| API com regras reais | ✅ Resumo mensal, investimento vs. saídas, orçamentos, metas |
| JWT | ✅ |
| Relatórios | ✅ Mensal (`/reports/monthly-summary`) |
| IA integrada | ✅ Endpoint + fallback; chave só em produção |
| Deploy online | 🟡 Documentação pronta; falta **executar** e colar URL |
| README profissional | ✅ Completar links de demo |

---

## Ordem sugerida de trabalho (curta)

1. **Deploy** de API + DB (um URL no ar) — maior impacto no CV.  
2. **Swagger** com mais `@Operation` / exemplos nos endpoints restantes.  
3. (Opcional) Intervalo `inicio`/`fim` ou entidade `Category` — se quiseres aproximar ainda mais do “plano genérico”.  
4. Seguir [PASSO_A_PASSO_JUNIOR.md](PASSO_A_PASSO_JUNIOR.md) para links no README e vitrine GitHub.

*Última sincronização: estado do monorepo `hh-financeiro-v6` (API Spring + web Next.js).*
