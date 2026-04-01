# Organização do repositório HH Financeiro v6

Este documento descreve **onde cada tipo de artefato vive** e as **convenções** adotadas. O monorepo na **raiz** (`hh-financeiro-v6/`) é a fonte de verdade para desenvolvimento e CI.

## Visão geral

```
hh-financeiro-v6/
├── apps/
│   ├── api/                 # Backend Spring Boot (REST, JPA, segurança)
│   └── web/                 # Frontend Next.js (App Router)
├── packages/
│   └── types/               # Tipos TypeScript gerados do OpenAPI
├── docs/                    # Documentação complementar (este ficheiro)
├── docker-compose.yml       # Orquestração local: Postgres + API + Web
├── package.json             # Workspaces npm e scripts de orquestração
└── README.md                # Entrada principal do projeto
```

> **Nota:** Cópias antigas (`hh-Frontend-v6/`, `hh-backend-v6/`) foram **removidas** para evitar confusão. O código ativo está só em `apps/` na raiz.

---

## Backend — `apps/api`

### Convenção de pacotes (`com.hh.finance`)

| Pacote | Responsabilidade |
|--------|-------------------|
| *(raiz)* | `HhFinanceApiApplication` — bootstrap Spring Boot |
| `config` | `SecurityConfig`, CORS, JWT, SpringDoc/OpenAPI |
| `domain` | Entidades JPA (`User`, `Expense`, `Income`, `Goal`, …) |
| `dto` | Contratos de entrada/saída da API (records / classes imutáveis) |
| `repository` | Interfaces Spring Data JPA |
| `service` | Regras de negócio e transações (`@Transactional`) |
| `security` | JWT (`JwtService`, `JwtAuthFilter`, `CurrentUser`) |
| `controller` | Controladores REST (`@RestController`) — camada HTTP da API |

### Recursos

| Caminho | Uso |
|---------|-----|
| `src/main/resources/application.yml` | Configuração base + perfil `docker` |
| `src/main/resources/db/migration/` | Scripts Flyway (versão do schema) |
| `src/test/resources/application-test.yml` | H2 em memória, Flyway desligado, DDL `create-drop`; JDBC com `NON_KEYWORDS=MONTH,YEAR` (H2 2.x trata `month`/`year` como palavras reservadas); exclusão de `UserDetailsServiceAutoConfiguration` para não gerar utilizador in-memory em testes JWT |

### Testes (`src/test/java/com/hh/finance/`)

| Pacote | Tipo |
|--------|------|
| `service` | Testes unitários (Mockito) — lógica isolada |
| `controller` | Testes de integração HTTP (`@SpringBootTest` + `MockMvc`) |

---

## Frontend — `apps/web`

| Caminho | Uso |
|---------|-----|
| `app/` | Rotas e layouts (App Router do Next.js) |
| `app/dashboard/` | Área autenticada: resumo, despesas, receitas, assinaturas, metas, orçamentos |
| `app/login/` | Autenticação |
| `components/` | UI reutilizável |
| `lib/` | Cliente HTTP (`api.ts`), formatação (`format.ts`), constantes (`categories.ts`) |

**Dependência de tipos:** `@hh/types` — alinhar com a API após mudanças em DTOs (ver `npm run generate:types` na raiz).

---

## Pacote compartilhado — `packages/types`

- `openapi.snapshot.json` — contrato OpenAPI versionado (CI/offline).
- `src/api.d.ts` — tipos gerados; **não editar à mão** salvo exceções pontuais.

---

## Boas práticas resumidas

1. **Mudanças de API:** alterar Java → atualizar snapshot/tipos → commit conjunto (`openapi.snapshot.json` + `api.d.ts`).
2. **Novos endpoints:** DTO em `dto`, serviço em `service`, repositório só se houver persistência nova.
3. **Segredos:** nunca commitar `HH_JWT_SECRET` real; usar variáveis de ambiente em produção.
4. **Testes:** preferir testes de serviço com mocks para regras; integração com `MockMvc` para fluxos auth + um recurso.

---

## Comandos úteis

```bash
# API (testes)
mvn -f apps/api test

# Tipos + build web (raiz)
npm run verify:types && npm run build -w @hh/web

# Stack completa
docker compose up --build
```
