# Etapas do projeto — HH Financeiro v6

Narrativa curta para **portfólio / entrevista**: o que foi construído e em que ordem lógica. Detalhe técnico em [`ARCHITECTURE.md`](../ARCHITECTURE.md) e [`STRUCTURE.md`](../STRUCTURE.md).

| # | Etapa | Estado |
|---|--------|--------|
| 1 | Monorepo API + Web + types | Feito |
| 2 | JWT + isolamento `user_id` | Feito |
| 3 | Receitas, despesas, assinaturas, metas, orçamentos | Feito |
| 4 | OpenAPI → TypeScript gerado (`verify:types`) | Feito |
| 5 | Análise mensal (OpenAI opcional / determinístico) | Feito |
| 6 | Docker Compose local | Feito |
| 7 | Deploy Railway + Vercel | Pendente (Dias 4–8 da trilha) |

---

## 1. Monorepo API + Web + types

Um único repositório com `apps/api` (Spring Boot), `apps/web` (Next.js) e `packages/types` (contrato TypeScript). Scripts na raiz orquestram testes, geração de tipos e build.

- Estrutura: [`STRUCTURE.md`](../STRUCTURE.md)
- Entrada: [`README.md`](../../README.md)

---

## 2. JWT + isolamento `user_id`

Autenticação Bearer JWT (stateless). Cada entidade operacional está ligada ao utilizador; a API filtra por `user_id` do token — dois utilizadores não partilham dados financeiros.

- Fluxo: [`FLOWS.md`](../FLOWS.md) (registo/login e isolamento)
- Segurança pré-deploy: [`SEGURANCA-DEPLOY.md`](../SEGURANCA-DEPLOY.md)

---

## 3. Receitas, despesas, assinaturas, metas, orçamentos

Domínio de finanças pessoais na API e telas autenticadas no dashboard: lançamentos, assinaturas, metas de poupança e orçamentos, com resumo mensal agregado (incluindo separação de investimentos nas saídas).

- Screenshots: [`../screenshots/`](../screenshots/README.md)
- Fluxos: [`FLOWS.md`](../FLOWS.md)

---

## 4. OpenAPI → TypeScript gerado (`verify:types`)

SpringDoc expõe OpenAPI; tipos em `packages/types` são gerados a partir do contrato. CI/local usam `npm run verify:types` para evitar drift entre API e web.

- Comandos: [`AGENTS.md`](../../AGENTS.md)
- Pastas: [`STRUCTURE.md`](../STRUCTURE.md)

---

## 5. Análise mensal (OpenAI opcional / determinístico)

`GET /api/v1/insights/monthly-analysis` devolve texto do mês. Com `OPENAI_API_KEY` na API, pode usar modelo de linguagem; sem chave, usa resumo automático a partir dos mesmos números (adequado a demos sem custo).

- Entrevistas: [`ENTREVISTAS.md`](../ENTREVISTAS.md)

---

## 6. Docker Compose local

`docker compose up --build` sobe Postgres + API (`:8090`) + Web (`:3000`). Perfil Docker, Flyway e health em `/actuator/health`.

- Guia junior: [`PASSO_A_PASSO_JUNIOR.md`](../PASSO_A_PASSO_JUNIOR.md)
- Compose: raiz do monorepo `docker-compose.yml`

---

## 7. Deploy Railway + Vercel

Publicar API + Postgres (Railway) e frontend (Vercel), configurar `HH_CORS_ORIGINS`, JWT e URLs na secção Demo online do README.

- Guia: [`DEPLOY-RAILWAY.md`](../DEPLOY-RAILWAY.md)
- Alternativa: [`DEPLOY.md`](../DEPLOY.md) (Render/Neon)
- **Estado:** pendente — trilha Dias 4–8

---

## DoD Fase A (apresentação)

- [x] Checklist portfólio no README (Dia 1)
- [x] Screenshots no README (Dia 2)
- [x] Este ficheiro de etapas linkado (Dia 3)
