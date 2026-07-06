# HH Financeiro

<div align="center">

**Gestão financeira pessoal — API + web no mesmo monorepo**

[Documentação técnica](#-documentação-técnica) · [Como rodar local](#-desenvolvimento-local) · [Deploy Railway (recomendado)](docs/DEPLOY-RAILWAY.md) · [Deploy Render/Neon](docs/DEPLOY.md) · [**Próximos passos (junior)**](docs/PASSO_A_PASSO_JUNIOR.md)

</div>

---

## Problema e solução

| | |
|--|--|
| **Problema** | Planilhas e apps genéricos não mostram, num só sítio, receitas, despesas, investimento, metas e orçamentos — nem ajudam a **ler o mês** nem a priorizar ações. |
| **Solução** | **HH Financeiro** reúne estes dados numa API e numa web, com **resumo mensal**, **isolamento por utilizador (JWT)** e **análise textual do mês**: com `OPENAI_API_KEY` na API, o texto pode ser gerado por modelo de linguagem; sem chave, usa um **resumo determinístico** a partir dos mesmos números. |

---

## Resumo para LinkedIn / vitrine (copiar)

**GitHub:** https://github.com/HelderAbud/Gestao-Financeira

**Gestão Financeira (HH Financeiro)**

Aplicação full stack para acompanhar receitas, despesas, assinaturas, metas de poupança e orçamentos mensais, com resumo agregado e dados isolados por utilizador (JWT).

**Tecnologias:** Java 21, Spring Boot 3, Spring Security, PostgreSQL, Flyway, Next.js, TanStack Query, OpenAPI / Swagger

**Destaques:**

- Cenário real de produto (finanças pessoais)
- API REST versionada + web no mesmo monorepo
- Análise do mês (`GET /api/v1/insights/monthly-analysis`) com IA opcional (OpenAI) ou resumo automático

---

## Demo online

| | Link |
|--|------|
| **App (Next.js)** | _Adicione aqui após deploy — ex.: `https://hh-financeiro.vercel.app`_ |
| **API (Swagger)** | _ex.: `https://sua-api.onrender.com/swagger-ui.html`_ |

> Substitua os placeholders acima pelos URLs reais após seguir [docs/DEPLOY.md](docs/DEPLOY.md). Um link clicável aumenta muito a visibilidade do projeto em processos seletivos.

### Checklist portfólio / LinkedIn (preencha à mão)

| Campo | O que colocar |
|--------|----------------|
| `[PREENCHER]` **Pitch em uma linha** | Ex.: *Gestão financeira pessoal full stack — receitas, despesas, metas, JWT, Next.js + Spring.* |
| `[PREENCHER]` **URL do repositório público** | `https://github.com/[seu-usuario]/[nome-do-repo]` |
| `[PREENCHER]` **Post ou carrossel LinkedIn** | Link para publicação que apresenta o projeto |
| `[PREENCHER]` **Diferencial / IA (futuro)** | Ex.: *Roadmap: insights de gastos com IA — ainda não implementado* (seja honesto) |
| `[PREENCHER]` **Contato** | E-mail ou LinkedIn para recrutadores |

---

## Objetivo

Aplicação para **acompanhar receitas, despesas, assinaturas, metas de poupança e orçamentos mensais**, com **resumo agregado** (incluindo separação de investimentos nas despesas) e **dados isolados por utilizador** (JWT).

---

## Público-alvo

Pessoas que querem **registar e analisar finanças pessoais ou domésticas** numa única ferramenta web, sem depender apenas de planilhas.

---

## O meu papel

**Projeto desenvolvido individualmente** para estudo aprofundado de **Spring Boot**, **Next.js**, **PostgreSQL**, **OpenAPI** e **CI** — não é um tutorial copiado: decisões de domínio, segurança, telas, testes e documentação foram feitas no contexto deste repositório.

---

## O que aprendi / pratiquei

- API REST versionada (`/api/v1`), contrato **OpenAPI** e tipos TypeScript **gerados** (`openapi-typescript`).
- Autenticação **JWT** stateless e isolamento por `user_id`.
- Migrações com **Flyway**, testes com **JUnit/Mockito** e integração com **H2**.
- Frontend com **TanStack Query**, layout responsivo e **Vitest** em utilitários.
- **GitHub Actions** (API + tipos + web) e preparação para **deploy** (Vercel + Render/Neon ou equivalentes).
- Integração opcional com **OpenAI** para texto de análise mensal (`hh.ai` / `OPENAI_API_KEY`).

---

## Screenshots

1. Guarde as imagens em [`docs/screenshots/`](docs/screenshots/README.md) (ex.: `landing.png`, `dashboard.png`).
2. Cole no README acima desta secção, por exemplo:

```markdown
| Início | Resumo |
|--------|--------|
| ![Início](docs/screenshots/landing.png) | ![Resumo](docs/screenshots/dashboard.png) |
```

---

## Tecnologias

| Área | Stack |
|------|--------|
| **Backend** | Java 21, Spring Boot 3, Spring Security, JPA, Flyway, PostgreSQL |
| **API docs** | SpringDoc OpenAPI |
| **Frontend** | Next.js 15, React 19, Tailwind CSS, TanStack Query |
| **Contrato** | OpenAPI → `packages/types` (TypeScript) |
| **Infra local** | Docker Compose |
| **Testes** | JUnit 5, Mockito, MockMvc, Vitest |

---

## Documentação técnica

| | |
|--|--|
| **Índice** | [docs/README.md](docs/README.md) |
| **Deploy (Railway + Vercel)** | **[docs/DEPLOY-RAILWAY.md](docs/DEPLOY-RAILWAY.md)** |
| **Deploy (Render + Neon)** | [docs/DEPLOY.md](docs/DEPLOY.md) |
| **Segurança pré-deploy** | [docs/SEGURANCA-DEPLOY.md](docs/SEGURANCA-DEPLOY.md) |
| **Arquitetura + diagramas** | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **Fluxos** | [docs/FLOWS.md](docs/FLOWS.md) |
| **Testes** | [docs/TESTING.md](docs/TESTING.md) |
| **Entrevistas** | [docs/ENTREVISTAS.md](docs/ENTREVISTAS.md) |
| **Pastas** | [docs/STRUCTURE.md](docs/STRUCTURE.md) |

---

## Estrutura do repositório

```
hh-financeiro-v6/
├── apps/
│   ├── web/          # Next.js — UI autenticada
│   └── api/          # Spring Boot + JWT + Flyway
├── packages/types/   # Tipos gerados do OpenAPI
├── docs/             # Docs + screenshots
├── docker-compose.yml
└── README.md
```

---

## Funcionalidades (web + API)

- Resumo mensal (receitas, saídas, investimento, saldo)
- **Análise textual do mês** (dashboard) — ver secção [Problema e solução](#problema-e-solução) e variável `OPENAI_API_KEY` em [`.env.example`](.env.example)
- Despesas e receitas por período
- Assinaturas (vínculo opcional em despesas)
- Metas com depósitos e barra de progresso
- Orçamentos por categoria e mês

---

## Testes automatizados

```bash
npm run test:api    # Maven — apps/api/src/test/java
npm run test:web    # Vitest
npm run test
```

Detalhes: [docs/TESTING.md](docs/TESTING.md).

---

## Desenvolvimento local

**Requisitos:** Node 20+, Java 21+, Maven, Docker (Postgres + stack completa).

> **Windows:** use **Ubuntu/WSL** para `docker compose` — no PowerShell sem Docker Desktop o comando `docker` não existe. Caminho típico: `/mnt/c/Users/.../Gestão Financeira/hh-financeiro-v6`.

### Opção A — Docker Compose (tudo)

```bash
docker compose up --build
```

- Web: http://localhost:3000  
- API: http://localhost:8090 · Swagger: http://localhost:8090/swagger-ui.html

### Opção B — só Postgres + API + Web

```bash
docker compose up -d db
cd apps/api && mvn spring-boot:run
# noutro terminal, na raiz:
npm install && npm run dev:web
```

Variáveis úteis: `HH_JWT_SECRET` (produção, ≥32 caracteres). Ver [`.env.example`](.env.example).

### Tipos TypeScript a partir da API

```bash
npm run generate:types
# ou offline:
npm run generate:types:snapshot
```

---

## CI (GitHub Actions)

O workflow ficheiro na **raiz do repositório Git** (pasta Gestão Financeira): [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — testes API, `npm run generate:types:snapshot` + verificação de drift do `api.d.ts`, testes web, build Next. Localmente: `npm run verify:types` (na pasta do monorepo).

---

## Segurança

Dados persistidos em texto na base; em produção use **HTTPS**, **segredos fortes** e **CORS** apenas para o domínio do frontend (`HH_CORS_ORIGINS` — ver [DEPLOY.md](docs/DEPLOY.md)).

---

## Licença

MIT (alinhar com o projeto original H&H se necessário).
