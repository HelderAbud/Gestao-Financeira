# Validation — Trilha Dia 2 (screenshots)

**Data:** 2026-07-27  
**Triagem:** Helder Simple · skills-pessoal fast path  
**Opção de captura:** B → Playwright em container Docker (Ubuntu/WSL)

## Checklist Dia 2

| Item | Resultado |
|------|-----------|
| `docs/screenshots/landing.png` | OK — landing `/` |
| `docs/screenshots/dashboard.png` | OK — resumo mensal com dados fictícios |
| Tabela de imagens no `README.md` | OK |
| Dados fictícios apenas | OK — seed demo (salário + mercado) |

## Validação manual (HITL)

| Item | Resultado |
|------|-----------|
| Stack local (compose Ubuntu) | OK — API `:8090`, web `:3000` |
| Criar conta no browser | OK (após fix CORS OPTIONS) |
| Abas do dashboard | OK — todas funcionando (confirmado pelo Helder) |

## Hotfix durante a fatia (fora do DoD de screenshots)

- Preflight `OPTIONS /api/v1/auth/register` respondia **401** → browser mostrava `Failed to fetch`.
- Correção: `http.cors` + `CorsConfigurationSource` + `OPTIONS` permitAll; teste `CorsSecurityIntegrationTest`; API Docker rebuildada.
- Verificado: OPTIONS **200** com `Access-Control-Allow-Origin: http://localhost:3000`.

## Fora desta fatia

- `docs/portfolio/etapas.md` → Dia 3
- Demo online / deploy → Dias 4–8

## Aprovado?

- [x] Fatia Dia 2 verificável (imagens + README + abas OK)
- [ ] Commit/push/PR — aguarda HITL
