# Plano - HH Financeiro Dia 4 (preparação Railway)

**Data:** 2026-07-27  
**Trilha:** Helder Normal · skills-pessoal (to-spec → fatia documental)  
**Branch:** `docs/trilha-dia-4-prep-railway`

## Objetivo

Fechar a preparação documental e HITL do `HH_JWT_SECRET` antes do deploy real no Railway (Dias 5–8).

## Escopo

- Confirmar leitura de `docs/DEPLOY-RAILWAY.md` e `docs/SEGURANCA-DEPLOY.md`
- Este plano em `.cursor/plans/plan-2026-07-27-hh-deploy-railway.md`
- Gerar `HH_JWT_SECRET` (32+ chars) só no chat / password manager — **não** versionar
- Checkboxes Dia 4 na `TRILHA-DIA-A-DIA.md` + grill-log de validação

## Fora de escopo

- Railway Postgres + serviço API → Dia 5
- Vercel frontend → Dia 6
- CORS + smoke login → Dia 7
- URLs no README / etapa 7 → Dia 8

## Paths Railway (repo `HelderAbud/Gestao-Financeira`)

| Item | Valor |
|------|--------|
| Dockerfile | `hh-financeiro-v6/apps/api/Dockerfile` |
| Docker context | `hh-financeiro-v6/apps/api` |
| Health | `/actuator/health` |
| CORS inicial | `http://localhost:3000` (atualizar com Vercel nos Dias 6–7) |

Variáveis só no painel: `SPRING_DATASOURCE_*`, `HH_JWT_SECRET`, `HH_CORS_ORIGINS`.

## Critério de pronto

- Plano + trilha Dia 4 `[x]` + `docs/grill-logs/validation-2026-07-27-trilha-dia-4.md`
- Secret gerado e guardado pelo autor fora do Git
- Diff só documental; nenhum secret em `git status` / commit
