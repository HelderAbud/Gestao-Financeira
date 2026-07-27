# Validation - Trilha Dia 4 (preparação Railway)

**Data:** 2026-07-27  
**Triagem:** Helder Normal · skills-pessoal (plano + fatia documental)

## Checklist Dia 4

| Item | Resultado |
|------|-----------|
| Ler `docs/DEPLOY-RAILWAY.md` | OK |
| Ler `docs/SEGURANCA-DEPLOY.md` | OK |
| Plano `.cursor/plans/plan-2026-07-27-hh-deploy-railway.md` | OK |
| `HH_JWT_SECRET` (32+) gerado HITL | OK — só no chat / password manager; **não** versionado |
| Checkboxes Dia 4 na trilha | OK |

## Paths confirmados (repo raiz GitHub)

| Item | Valor |
|------|--------|
| Dockerfile | `hh-financeiro-v6/apps/api/Dockerfile` |
| Docker context | `hh-financeiro-v6/apps/api` |
| Health | `/actuator/health` |

## Fora desta fatia

- Railway Postgres + API → Dia 5
- Vercel / CORS / smoke / URLs README → Dias 6–8

## Aprovado?

- [x] Fatia Dia 4 verificável (docs + plano + secret HITL fora do Git)
- [ ] Commit/push/PR — branch `docs/trilha-dia-4-prep-railway`
