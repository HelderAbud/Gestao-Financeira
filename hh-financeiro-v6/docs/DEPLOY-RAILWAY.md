# Deploy com Railway + Vercel (recomendado)

Guia passo a passo quando **Neon** falha na UI ou **Docker** só roda no **Ubuntu/WSL**. Não exige Docker no PC Windows.

## Ordem

1. Railway: PostgreSQL + API  
2. Testar health e Swagger  
3. Vercel: frontend  
4. Ajustar CORS na API  
5. Atualizar `README.md` com links reais  

---

## 1. Railway — projeto e Postgres

1. Acesse [railway.app](https://railway.app) → login com GitHub.
2. **New Project** → **Deploy from GitHub repo** → `Gestao-Financeira`.
3. No projeto: **+ New** → **Database** → **PostgreSQL**.
4. Clique no Postgres → aba **Variables** (ou **Connect**).
5. Anote **só para você** (não commitar):
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

---

## 2. Railway — serviço da API

1. **+ New** → **GitHub Repo** (ou use o serviço já criado pelo import).
2. Configuração:
   - **Root:** repositório na raiz (monorepo).
   - **Dockerfile path:** `hh-financeiro-v6/apps/api/Dockerfile` *(ajuste se a raiz do repo for `hh-financeiro-v6/`)*.
   - **Docker context:** `hh-financeiro-v6/apps/api` ou `apps/api` conforme estrutura no GitHub.

3. **Variables** do serviço API:

| Variável | Valor |
|----------|--------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://PGHOST:PGPORT/PGDATABASE?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | valor de `PGUSER` |
| `SPRING_DATASOURCE_PASSWORD` | valor de `PGPASSWORD` |
| `HH_JWT_SECRET` | string aleatória com **32+ caracteres** |
| `HH_CORS_ORIGINS` | `http://localhost:3000` *(atualize depois com URL Vercel)* |

4. **Health check / path:** `/actuator/health`
5. **Deploy** e aguarde logs: Flyway deve aplicar migrations (`V1`, `V2`).

### Testes

```text
https://SUA-API.up.railway.app/actuator/health
https://SUA-API.up.railway.app/swagger-ui.html
```

Esperado: `"status":"UP"` e Swagger abrindo.

---

## 3. Vercel — frontend

1. [vercel.com](https://vercel.com) → importar repo `Gestao-Financeira`.
2. **Root Directory:** `hh-financeiro-v6/apps/web` *(ou `apps/web` se a raiz do repo for o monorepo)*.
3. **Environment variable:**

| Nome | Valor |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://SUA-API.up.railway.app` *(sem barra no fim)* |

4. Deploy.
5. Copie a URL final (ex.: `https://gestao-financeira.vercel.app`).

---

## 4. CORS (obrigatório após Vercel)

No Railway, serviço **API**, edite `HH_CORS_ORIGINS`:

```text
https://SUA-URL.vercel.app,http://localhost:3000
```

Redeploy da API. Teste login no site público — consola do browser **sem** erro CORS.

---

## 5. Checklist de produção

- [ ] Registo + login no app público
- [ ] Dashboard / resumo do mês carrega
- [ ] Swagger abre na URL pública
- [ ] `README.md` atualizado com links App + Swagger
- [ ] GitHub pin + post LinkedIn (ver `docs/LINKEDIN-POST.md`)

---

## Problemas comuns

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| API não sobe | JDBC errado | Conferir host/porta/db; `?sslmode=require` |
| 401 no front | URL API errada | `NEXT_PUBLIC_API_URL` sem barra final |
| CORS no browser | Origem não listada | `HH_CORS_ORIGINS` = URL exata da Vercel |
| Cold start lento | Plano free Railway | Normal; aguardar 30–60 s |

---

## Alternativa: Render + Supabase

Se preferir Render para API e Supabase para Postgres, use [DEPLOY.md](./DEPLOY.md) — mesmas variáveis `SPRING_DATASOURCE_*`.
