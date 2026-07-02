# Backend Java / Spring — HH Financeiro v6

- Controllers (`com.hh.finance.controller`) devem permanecer **finos**: validação HTTP, delegação ao serviço, mapeamento DTO.
- **Regra de negócio** em `service`; **persistência** via `repository`; **entidades** em `domain`.
- Não colocar lógica de negócio pesada em `@RestController`.
- Configuração de segurança, CORS, JWT e OpenAPI em `config` / `security` — não duplicar.
- Integrações externas (ex.: cliente HTTP/IA) devem ficar **encapsuladas** e alinhadas ao padrão existente no projeto.
- Mudanças devem seguir o **padrão já presente** em `com.hh.finance` (nomes, DTOs records/classes imutáveis, tratamento de erros).
- Evitar **abstrações novas** (camadas genéricas, “base services”) sem benefício claro.
- **Preservar contratos públicos** da API salvo pedido explícito; breaking changes exigem coordenação com frontend e `packages/types`.
- Antes de editar muitos ficheiros, propor um **plano curto** e impacto em testes.
