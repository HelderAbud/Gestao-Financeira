# AGENTS.md — HH Financeiro v6

Guia principal para agentes e contribuidores. Detalhes: [README.md](README.md), [docs/STRUCTURE.md](docs/STRUCTURE.md), [docs/TESTING.md](docs/TESTING.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Visão geral do projeto

- **Domínio:** gestão financeira pessoal — receitas, despesas, assinaturas, metas, orçamentos, resumo mensal, análise textual do mês (OpenAI opcional ou resumo determinístico).
- **Stack:** Java 21, Spring Boot 3, Spring Security (JWT), JPA, Flyway, PostgreSQL; frontend Next.js 15, React 19, TanStack Query; contrato OpenAPI → tipos em `packages/types`.
- **Monorepo:** `apps/api` (API REST `/api/v1`), `apps/web` (UI), `packages/types` (TypeScript gerado — não editar `api.d.ts` à mão salvo exceção).
- **Isolamento:** dados por utilizador (`user_id`); JWT stateless.

## Comandos (raiz `hh-financeiro-v6/`)

| Objetivo | Comando |
|----------|---------|
| Stack local (Postgres + API + Web) | `docker compose up --build` |
| Só Postgres | `docker compose up -d db` |
| API | `cd apps/api && mvn spring-boot:run` ou `npm run dev:api` (na raiz) |
| Web | `npm install && npm run dev:web` |
| Testes API | `npm run test:api` (`mvn -B -f apps/api test`) |
| Testes Web | `npm run test:web` |
| Todos os testes | `npm run test` |
| Gerar tipos a partir da API em execução | `npm run generate:types` |
| Tipos offline (snapshot) | `npm run generate:types:snapshot` |
| Verificar drift de tipos (CI/local) | `npm run verify:types` |
| Lint web | `npm run lint:web` |
| Build | `npm run build` |

Swagger local (compose ou API a correr): `http://localhost:8090/swagger-ui.html`

## Regras de arquitetura

- **Controllers** finos; **regras de negócio** em `service` (transações `@Transactional` quando aplicável).
- **Persistência:** entidades em `domain`, interfaces em `repository`, contratos HTTP em `dto`.
- **Segurança / JWT:** `config`, `security` — não duplicar lógica de auth nos controllers.
- **Integrações externas** (ex.: OpenAI): manter isoladas e testáveis; não espalhar detalhes de cliente pela camada de domínio.
- **Mudanças de schema:** sempre via Flyway em `apps/api/src/main/resources/db/migration/` — nunca alterar BD em produção sem migration versionada.
- **Contrato API:** alterações em DTOs/OpenAPI devem acompanhar fluxo de tipos (`generate:types` / snapshot + `verify:types`). Ver [docs/STRUCTURE.md](docs/STRUCTURE.md).

## Convenções de código

- Preferir **mudanças pequenas** e alinhadas ao padrão existente no pacote `com.hh.finance`.
- **Evitar** abstrações novas sem necessidade clara.
- **Preservar** contratos públicos da API salvo pedido explícito e coordenação com frontend e `packages/types`.
- Logging e exceções: seguir estilo já usado no projeto; não adicionar ruído desnecessário.

## Testes

- Nova **regra de negócio** deve incluir teste (serviço com Mockito, ou integração MockMvc quando fizer sentido).
- **Correção de bug:** preferir teste de regressão quando viável.
- Não considerar trabalho concluído com **testes a falhar**; se não for possível executar testes, documentar o motivo.
- Perfil `test` da API: H2, Flyway desligado — ver [docs/TESTING.md](docs/TESTING.md).

## Fluxo de trabalho (tarefas não triviais)

- **Planear** antes de editar em bloco; quebrar em passos verificáveis.
- Mostrar **impacto** antes de alterar contrato HTTP, schema Flyway ou integrações.
- Planos relevantes podem ser guardados em `.cursor/plans/` (ver README nessa pasta).

## Segurança

- **Não** commitar segredos reais (`HH_JWT_SECRET`, chaves API, etc.); usar `.env` local e [`.env.example`](.env.example) como referência.
- Pedir **aprovação explícita** antes de: migrations destrutivas ou arriscadas, breaking changes de API, operações em massa sobre dados.

## Caminhos importantes

| Caminho | Conteúdo |
|---------|----------|
| `apps/api/src/main/java/com/hh/finance/` | Código da API |
| `apps/api/src/test/java/com/hh/finance/` | Testes Java |
| `apps/api/src/main/resources/db/migration/` | Flyway |
| `apps/web/app/`, `apps/web/lib/` | Frontend |
| `packages/types/` | Tipos gerados + snapshot OpenAPI |
| `docs/` | Documentação técnica |
