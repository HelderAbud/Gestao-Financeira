# Notas para entrevistas — HH Financeiro v6

Este ficheiro ajuda a **responder com clareza** quando o projeto for discutido em processos seletivos.

## O projeto parece “grande demais” — escreveste tudo?

**Resposta sugerida:** O repositório é um **monorepo pessoal de aprendizagem/portfolio**: backend Spring Boot, frontend Next.js, contrato OpenAPI e testes. Fui eu que **estruturei e implementei** as funcionalidades descritas no README e na documentação em `docs/`. Parte do código segue **boas práticas da indústria** (camadas controller/service/repository, JWT, Flyway), por isso pode parecer “como numa empresa” — isso é intencional.

**O que é “gerado” ou standard:**

- Dependências e plugins Maven/npm (declarados em `pom.xml` / `package.json`).
- Tipos TypeScript em `packages/types/src/api.d.ts` são **gerados** a partir do OpenAPI (`openapi-typescript`), não escritos linha a linha — o contrato real está na API Java.
- UI base (Tailwind, padrões Next.js) reutiliza convenções comuns.

**O que é decisão e implementação minha:**

- Modelo de dados (despesas, receitas, metas, orçamentos, assinaturas) e regras (ex.: resumo mensal com categoria “Investimento”).
- Segurança JWT e isolamento por `user_id`.
- Testes em `src/test/java` e fluxo de CI.

## Onde está a documentação?

| Documento | Conteúdo |
|-----------|----------|
| [README.md](../README.md) | Como correr, testes, links |
| [STRUCTURE.md](./STRUCTURE.md) | Pastas e convenções |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack e diagramas |
| [FLOWS.md](./FLOWS.md) | Fluxos de auth e API |
| [TESTING.md](./TESTING.md) | Estrutura de testes |

## Frontend está integrado?

Sim: **Next.js** em `apps/web` consome a **API REST** com JWT — rotas sob `/dashboard` cobrem resumo mensal, despesas, receitas, assinaturas, metas (com depósitos) e orçamentos, alinhadas aos endpoints OpenAPI.

## Como demonstrar rapidamente

1. **Com deploy:** envie o link do Vercel + (opcional) Swagger da API — ver [DEPLOY.md](./DEPLOY.md).
2. **Local:** `docker compose up --build` **ou** Postgres + `mvn spring-boot:run` + `npm run dev:web`.
3. Criar conta → resumo → lançamentos.
4. `mvn -f apps/api test` ou `npm run test` para mostrar testes automatizados.
