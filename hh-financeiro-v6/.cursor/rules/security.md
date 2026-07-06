# Segurança — HH Financeiro v6

- **Nunca** commitar `.env`, passwords reais, `OPENAI_API_KEY`, ou JDBC com credenciais.
- Variáveis de produção só no painel Railway / Render / Vercel.
- `HH_JWT_SECRET` em produção: ≥ 32 caracteres aleatórios; não usar default de `application.yml`.
- `HH_CORS_ORIGINS`: listar origens exatas (protocolo + domínio); redeploy API após mudar Vercel.
- Auth atual: JWT Bearer + `localStorage` no front — documentar como risco conhecido; cookie `HttpOnly` exige aprovação explícita.
- Antes de push: revisar `git diff` contra [docs/SEGURANCA-DEPLOY.md](../../docs/SEGURANCA-DEPLOY.md).
