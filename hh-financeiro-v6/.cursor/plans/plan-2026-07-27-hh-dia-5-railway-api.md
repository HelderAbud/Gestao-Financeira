# Plano — HH Financeiro Dia 5 (Postgres + API Railway)

**Data:** 2026-07-27  
**Trilha:** Helder Normal · skills-pessoal (`to-spec` → fatia HITL deploy)  
**Repo:** https://github.com/HelderAbud/Gestao-Financeira  

## Problem

Preparação (Dia 4) fechada; falta publicar Postgres + API no Railway com health/Swagger públicos.

## Scope

1. **HITL Railway:** New Project → Postgres + serviço API (Dockerfile)
2. Variáveis no painel (sem commit): datasource, `HH_JWT_SECRET`, `HH_CORS_ORIGINS=http://localhost:5175`
3. Confirmar Flyway (V1, V2…) nos logs
4. Validar `/actuator/health` UP + Swagger
5. Grill-log + checkboxes Dia 5 na trilha (após evidência)

## Out of scope

- Vercel frontend → Dia 6  
- CORS com URL Vercel + smoke login → Dia 7  
- URLs no README / etapa 7 → Dia 8  
- Commit/push/PR sem pedido explícito  

## Paths (raiz GitHub = monorepo Gestão Financeira)

| Item | Valor |
|------|--------|
| Dockerfile | `hh-financeiro-v6/apps/api/Dockerfile` |
| Docker context | `hh-financeiro-v6/apps/api` |
| Health path | `/actuator/health` |
| App listen | `SERVER_PORT=8083` (Dockerfile) |
| CORS inicial | `http://localhost:5175` |

## Variáveis API (só painel Railway)

| Variável | Valor |
|----------|--------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://PGHOST:PGPORT/PGDATABASE?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `PGUSER` |
| `SPRING_DATASOURCE_PASSWORD` | `PGPASSWORD` |
| `HH_JWT_SECRET` | o do Dia 4 (32+ chars; password manager) |
| `HH_CORS_ORIGINS` | `http://localhost:5175` |

Opcional Railway: se health falhar por porta, definir **Target Port = 8083** no serviço (app não usa `$PORT` por defeito).

## Acceptance criteria

- [ ] Postgres no mesmo projeto Railway  
- [ ] API deployada a partir do Dockerfile acima  
- [ ] Logs mostram Flyway aplicado  
- [ ] `GET …/actuator/health` → `"status":"UP"`  
- [ ] Swagger UI abre na URL pública  
- [ ] Nenhum secret no Git / chat (só URL health se quiser partilhar)  
- [ ] `docs/grill-logs/validation-2026-07-27-trilha-dia-5.md` + trilha Dia 5 `[x]`  

## Risks

| Risco | Mitigação |
|-------|-----------|
| JDBC sem `sslmode=require` | URL exacta do guia |
| Porta 8083 vs proxy Railway | Target Port 8083 |
| Secret no commit | só Variables do serviço |
| Root/context errados | paths da tabela acima |

## Verification

1. Abrir health + Swagger no browser  
2. Grill-log com URL pública (sem passwords)  
3. Atualizar checkboxes Dia 5  

## Status

`ready-for-execution` — aguarda HITL no painel Railway.
