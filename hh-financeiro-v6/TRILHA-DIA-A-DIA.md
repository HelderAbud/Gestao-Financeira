# Trilha dia a dia — HH Financeiro v6

> **Metodologia:** [Helder Method v1.2](../../Agentes/helder-method-v1.2-resumo-compartilhavel.md) + [skills-pessoal](../../Agentes/skills-pessoal/skills-pessoal/README-pt_br.md) ([WORKFLOW](../../Agentes/skills-pessoal/skills-pessoal/WORKFLOW.md))  
> **Iniciativa:** Portfólio carro-chefe #2 — deploy + apresentação (doc já madura)  
> **Triagem Helder:** **Normal** (deploy, CORS, JWT, monorepo)  
> **Custo:** R$ 0 — seguir [`docs/DEPLOY-RAILWAY.md`](docs/DEPLOY-RAILWAY.md)  
> **Repo:** https://github.com/HelderAbud/Gestao-Financeira  

---

## Como usar

1. **Prioridade:** Fase B (deploy) pode começar no **Dia 1** se apresentação esperar.
2. Planos: `.cursor/plans/plan-YYYY-MM-DD-hh-*.md` (`to-issues` em dias Normal).
3. Validação: `docs/grill-logs/validation-YYYY-MM-DD-*.md` + `slice-verification`.
4. Contrato API: alterações exigem `npm run verify:types` ([`AGENTS.md`](AGENTS.md)).
5. Commit/push/PR só com pedido explícito (HITL).

### Helder → skills-pessoal

| Trilha Helder | Caminho |
|---------------|---------|
| **Simple** | Fast path: fazer → verificar → resumir |
| **Normal** | `to-spec` → `to-issues` → `tdd` (se regra) → `slice-verification` → `code-review` |
| **Complex** | igual Normal + HITL entre fases |
| **Hotfix** | `diagnose` → patch mínimo → regressão → só então retomar |

### Core Workflow (mapa)

| Fase | Skill |
|------|-------|
| Spec | `to-spec` |
| Plan | `to-issues` |
| Branch | `git-workflow-and-versioning` |
| Build | `tdd` (regra / bug); API → `verify:types` |
| Verify | `slice-verification` (testes, smoke deploy) |
| Review | `code-review` |
| Simplify | `code-simplification` |
| Ship | `finishing-a-development-branch` |

### Gates HITL

- `HH_JWT_SECRET`, credenciais Postgres Railway/Neon
- `OPENAI_API_KEY` em prod (opcional — fallback determinístico OK)
- Breaking change em `/api/v1`
- Push com `.env` ou segredos
- Commit, push ou PR

---

## Visão (14 dias)

| Fase | Dias | Foco | Trilha |
|------|------|------|--------|
| A — Apresentação | 1–3 | Screenshots, checklist README, etapas | Simple |
| B — Deploy | 4–8 | Railway + Vercel | Normal |
| C — Smoke + docs | 9–11 | Fluxos, ENTREVISTAS | Normal |
| D — Portfólio | 12–14 | LinkedIn, validation | Simple |

---

## Fase A — Apresentação

### Dia 1 — Checklist README 📋

**Trilha:** Simple

**Tarefas**
- [ ] Preencher tabela "Checklist portfólio / LinkedIn" no [`README.md`](README.md)
- [ ] Pitch 1 linha definitivo
- [ ] URL GitHub confirmada
- [ ] Plano: `.cursor/plans/plan-YYYY-MM-DD-hh-readme-checklist.md`

**Prompt Cursor**
```text
HH Financeiro Dia 1 — preencher checklist portfólio no README.
Trilha Simple. Não inventar URLs fake; usar "pendente deploy" onde aplicável.
```

---

### Dia 2 — Screenshots

- [ ] `docs/screenshots/landing.png` — página inicial
- [ ] `docs/screenshots/dashboard.png` — resumo mensal
- [ ] Colar tabela de imagens no README (modelo já existe no README)
- [ ] Dados fictícios apenas

**Validação:** 2 imagens visíveis no README.

---

### Dia 3 — `docs/portfolio/etapas.md` 📋

**7 etapas**
1. Monorepo API + Web + types  
2. JWT + isolamento `user_id`  
3. Receitas, despesas, assinaturas, metas, orçamentos  
4. OpenAPI → TypeScript gerado (`verify:types`)  
5. Análise mensal (OpenAI opcional / determinístico)  
6. Docker Compose local  
7. Deploy Railway + Vercel  

**DoD Fase A:** checklist + screenshots + etapas linkadas.

---

## Fase B — Deploy (guia pronto)

### Dia 4 — Preparação Railway 📋

| Trilha | Normal |

**Tarefas**
- [ ] Ler [`docs/DEPLOY-RAILWAY.md`](docs/DEPLOY-RAILWAY.md) completo
- [ ] Ler [`docs/SEGURANCA-DEPLOY.md`](docs/SEGURANCA-DEPLOY.md)
- [ ] Plan: `.cursor/plans/plan-YYYY-MM-DD-hh-deploy-railway.md`
- [ ] Gerar `HH_JWT_SECRET` (32+ chars) — **HITL**, não commitar

---

### Dia 5 — Postgres + API Railway

- [ ] New Project → Postgres
- [ ] Serviço API: Dockerfile `apps/api/Dockerfile`
- [ ] Variáveis: datasource, JWT, CORS `http://localhost:3000` (temporário)
- [ ] Flyway V1, V2… aplicadas
- [ ] `/actuator/health` UP

**Validação:** Swagger Railway responde.

---

### Dia 6 — Vercel (frontend)

- [ ] Deploy `apps/web`
- [ ] Env: URL da API
- [ ] Atualizar `HH_CORS_ORIGINS` na API com URL Vercel

---

### Dia 7 — CORS + smoke login

- [ ] Registro ou login teste
- [ ] Criar 1 despesa + 1 receita fictícias
- [ ] Dashboard mostra resumo mês

**HITL:** revisar CORS e secrets antes de marcar done.

---

### Dia 8 — URLs no README + etapa 7

- [ ] Seção Demo online preenchida
- [ ] `docs/portfolio/etapas.md` etapa 7 ✅
- [ ] `docs/grill-logs/validation-YYYY-MM-DD-deploy.md`

**DoD Normal deploy:** app + API públicos + health OK.

---

## Fase C — Qualidade e narrativa

### Dia 9 — Testes CI 📋

- [ ] `npm run test` na raiz (API + web)
- [ ] Badge CI no README (workflow em `.github/workflows/ci.yml` na raiz Gestão Financeira)
- [ ] Corrigir falhas — Hotfix se necessário

---

### Dia 10 — Fluxo documentado

- [ ] Revisar [`docs/FLOWS.md`](docs/FLOWS.md) vs app real pós-deploy
- [ ] 1 fluxo: cadastro → despesa → insight mensal
- [ ] Screenshot insight (com ou sem OpenAI)

---

### Dia 11 — Entrevistas

- [ ] Revisar [`docs/ENTREVISTAS.md`](docs/ENTREVISTAS.md)
- [ ] Adicionar 1 Q&A sobre fallback determinístico vs OpenAI
- [ ] Link destacado no README

---

## Fase D — Fechamento

### Dia 12 — [`docs/PASSO_A_PASSO_JUNIOR.md`](docs/PASSO_A_PASSO_JUNIOR.md)

- [ ] Validar que junior consegue seguir do zero (você simula)
- [ ] Anotar gaps → issues ou mini-fix doc

---

### Dia 13 — LinkedIn

- [ ] Post: monorepo + tipos gerados + deploy + insight mês
- [ ] Links demo + GitHub

---

### Dia 14 — Validation trilha

- [ ] Rubrica: segurança, types drift, deploy smoke
- [ ] `docs/grill-logs/validation-YYYY-MM-DD-trilha-completa.md`
- [ ] Atualizar [`docs/grill-logs/`](docs/grill-logs/) existente se houver

---

## Ordem alternativa (se deploy urgente)

| Ordem | Dias |
|-------|------|
| Deploy primeiro | 4–8 → depois 1–3 apresentação → 9–14 |

---

## Prompt base Cursor

```text
HH Financeiro v6 — Dia N do TRILHA-DIA-A-DIA.md.
Monorepo: apps/api, apps/web, packages/types.
Helder [Simple|Normal|Complex|Hotfix] + skills-pessoal.
Normal: to-spec → to-issues → fatia → tdd se regra → slice-verification.
Mudança API → npm run verify:types. Deploy: DEPLOY-RAILWAY.md. HITL em secrets/CORS/commit.
```

---

## Referências

| Doc | Uso |
|-----|-----|
| [`AGENTS.md`](AGENTS.md) | Comandos agente |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Diagramas |
| [`docs/TESTING.md`](docs/TESTING.md) | Testes |
| [`.cursor/plans/`](.cursor/plans/) | Planos fatia |

---

*Trilha v1.1 — 2026-07-09 — Helder v1.2 + skills-pessoal*
