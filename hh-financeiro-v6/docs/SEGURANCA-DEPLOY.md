# Segurança e dados sensíveis — HH Financeiro v6

Auditoria pré-deploy (2026-07-02). Use como checklist antes de publicar ou commitar.

## Resultado da varredura

| Item | Status | Notas |
|------|--------|-------|
| `.env` / `.env.local` no Git | OK | `.gitignore` cobre; só `.env.example` versionado |
| Chaves `.pem` / `.key` | OK | Nenhuma encontrada no monorepo |
| `OPENAI_API_KEY` real no código | OK | Só placeholder em `.env.example` |
| Senhas de produção no repo | OK | Defaults em `docker-compose.yml` / `application.yml` são **só dev local** |
| JWT em `localStorage` (web) | Risco aceito (portfólio) | Auth via `Authorization: Bearer`; melhoria futura: cookie `HttpOnly` |
| CORS com `allowCredentials` | Corrigido | Removido; API usa Bearer, não cookies |
| Swagger público em produção | Atenção | Documenta contrato; endpoints protegidos exigem JWT |

## O que nunca commitar

- `.env` com `HH_JWT_SECRET`, `SPRING_DATASOURCE_PASSWORD`, `OPENAI_API_KEY`
- Exports de clientes, PDFs com dados reais, cookies de sessão
- URLs de admin com tokens embutidos

## Variáveis só no painel (Render / Railway / Vercel)

| Variável | Onde |
|----------|------|
| `SPRING_DATASOURCE_URL` | API (hosting) |
| `SPRING_DATASOURCE_USERNAME` | API |
| `SPRING_DATASOURCE_PASSWORD` | API |
| `HH_JWT_SECRET` | API (≥ 32 caracteres aleatórios) |
| `HH_CORS_ORIGINS` | API (URL exata da Vercel, sem barra final) |
| `OPENAI_API_KEY` | API (opcional) |
| `NEXT_PUBLIC_API_URL` | Vercel (URL pública da API) |

## Desenvolvimento local

- **Docker:** use **Ubuntu/WSL** (`docker compose up --build`), não PowerShell no Windows sem Docker Desktop.
- **Porta API:** `8090` (evita colisão com outras APIs locais).
- **Segredo JWT local:** fallback em `application.yml` é só dev; em produção **obrigatório** `HH_JWT_SECRET` no painel.

## Gate antes do push

- [ ] `git diff` sem segredos reais
- [ ] `.env` não aparece em `git status`
- [ ] `HH_CORS_ORIGINS` em produção lista só domínios seus
- [ ] README sem passwords ou connection strings reais
