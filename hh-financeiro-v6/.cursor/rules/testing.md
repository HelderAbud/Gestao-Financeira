# Testes — HH Financeiro v6

- Toda **nova regra de negócio** deve incluir teste em `apps/api/src/test/java` (unitário com Mockito em `service/`, ou integração em `controller/` quando o fluxo HTTP+auth for crítico).
- Todo **bug corrigido** deve ganhar **teste de regressão** quando for viável reproduzir em teste.
- Preferir **testes de serviço** com mocks para lógica; **MockMvc** + `@SpringBootTest` para fluxos que cruzam segurança e HTTP.
- **Não** marcar tarefa como concluída com testes Java ou web a falhar.
- Se os testes **não puderem ser executados** no ambiente atual, explicar o motivo (dependência, Docker, JDK, etc.).
- Após alterar contrato OpenAPI/DTOs: correr `npm run verify:types` na raiz do monorepo quando o fluxo incluir tipos gerados.
- Comandos: `npm run test:api`, `npm run test:web`, `npm run test` — ver [docs/TESTING.md](../../docs/TESTING.md).
