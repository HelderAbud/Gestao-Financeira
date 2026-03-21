# HH Financeiro

<div align="center">

**Gestão financeira pessoal — API + web no mesmo monorepo**

[Documentação técnica](#-documentação-técnica) · [Como rodar local](#-desenvolvimento-local) · [Deploy na nuvem](docs/DEPLOY.md)

</div>

---

## Demo online

| | Link |
|--|------|
| **App (Next.js)** | _Adicione aqui após deploy — ex.: `https://hh-financeiro.vercel.app`_ |
| **API (Swagger)** | _ex.: `https://sua-api.onrender.com/swagger-ui.html`_ |

> Substitua os placeholders acima pelos URLs reais após seguir [docs/DEPLOY.md](docs/DEPLOY.md). Um link clicável aumenta muito a visibilidade do projeto em processos seletivos.

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
| **Deploy (Vercel, Render, Neon, env)** | **[docs/DEPLOY.md](docs/DEPLOY.md)** |
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

**Requisitos:** Node 20+, Java 21+, Maven, Docker (opcional para Postgres).

### Opção A — Docker Compose (tudo)

```bash
docker compose up --build
```

- Web: http://localhost:3000  
- API: http://localhost:8080 · Swagger: http://localhost:8080/swagger-ui.html  

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

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) — testes API, geração de tipos, testes web, build Next, verificação de drift do `api.d.ts`.

---

## Segurança

Dados persistidos em texto na base; em produção use **HTTPS**, **segredos fortes** e **CORS** apenas para o domínio do frontend (`HH_CORS_ORIGINS` — ver [DEPLOY.md](docs/DEPLOY.md)).

---

## Licença

MIT (alinhar com o projeto original H&H se necessário).
