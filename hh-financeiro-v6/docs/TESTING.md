# Testes automatizados — HH Financeiro v6

A API e o frontend têm **testes automatizados** visíveis no repositório e no CI.

## Comandos (raiz do monorepo)

```bash
npm run test:api    # Maven: testes Java
npm run test:web    # Vitest: testes TS/React utilitários
npm run test        # Ambos
```

GitHub Actions (`.github/workflows/ci.yml`): `mvn test` → `npm run generate:types:snapshot` → `npm run test:web` → `npm run build -w @hh/web` → verificação de drift dos tipos.

---

## Backend — `apps/api/src/test/java`

```
com/hh/finance/
├── HhFinanceApiApplicationTest.java      # Smoke: contexto Spring sobe (perfil test)
├── controller/
│   └── FinanceApiIntegrationTest.java     # MockMvc: auth, /users/me, relatório com dados
└── service/
    ├── AuthServiceTest.java
    ├── BudgetServiceTest.java
    ├── GoalServiceTest.java
    ├── ReportServiceTest.java
    └── SubscriptionServiceTest.java
```

| Tipo | Descrição |
|------|-----------|
| **Unitários (Mockito)** | Serviços isolados: regras de negócio, erros 404/409. |
| **Integração** | `@SpringBootTest` + `@AutoConfigureMockMvc`, H2 em memória (`application-test.yml`). |

### Perfil `test`

- Base H2 em memória; `NON_KEYWORDS=MONTH,YEAR` (compatibilidade com colunas `month`/`year`).
- Flyway desligado; Hibernate `create-drop`.

---

## Frontend — `apps/web`

- **Vitest** (`vitest.config.ts`): ficheiros `**/*.test.ts`.
- Exemplo: `lib/format.test.ts` — formatação monetária.

Testes de componentes E2E (Playwright/Cypress) podem ser adicionados numa fase seguinte.
