# Inventário LojApp embutido — REMOVIDO (fatia 4b)

**Decisão:** remover (2026-07-27).

## O que foi feito

- Apagados controller/service/DTOs/entities/repositories do módulo LojApp embutido.
- Criada migration forward-only [`V3__drop_lojapp_core.sql`](../apps/api/src/main/resources/db/migration/V3__drop_lojapp_core.sql) (V2 **não** foi editada).
- Frontend Next **não** referenciava estas rotas.

## Tabelas removidas (via V3)

`sales`, `inventory_movements`, `inventory_balances`, `nfe_items`, `nfe_entries`, `products`, `brands`

O projeto **Loja Sistema** (pasta à parte) **não** foi afetado.

Portas canônicas: API **8083**, Web **5175**, Postgres host **5434** — ver `Desktop/Agentes/PORTFOLIO-PORTS.md`.
