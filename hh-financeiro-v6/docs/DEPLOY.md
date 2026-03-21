# Deploy na nuvem — HH Financeiro v6

Objetivo: **URL pública** para o recrutador abrir o site e, se quiser, o Swagger. Sugestão de stack com **free tier**: **Neon** (Postgres) + **Render** (API Java) + **Vercel** (Next.js).

## Ordem recomendada

1. Criar base **Postgres** (Neon ou Railway).
2. Fazer deploy da **API** apontando para essa base.
3. Fazer deploy do **frontend** com `NEXT_PUBLIC_API_URL` = URL pública da API.
4. Configurar **CORS** na API com o domínio do Vercel.

---

## 1. Base de dados (ex.: Neon)

1. Crie um projeto em [Neon](https://neon.tech) e copie a connection string **com SSL** (`sslmode=require`).
2. Anote: host, base, utilizador, password (ou a URI completa `jdbc:postgresql://...`).

A API usa **Flyway**: ao arrancar, as migrações em `apps/api/src/main/resources/db/migration/` aplicam o schema.

---

## 2. API no Render (Docker)

O repositório já tem `apps/api/Dockerfile`.

1. No [Render](https://render.com), **New → Web Service**, ligue o repositório.
2. **Root**: monorepo na raiz; defina:
   - **Dockerfile path:** `apps/api/Dockerfile`
   - **Docker context:** `apps/api`
3. **Environment** (exemplo):

| Variável | Valor |
|----------|--------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://HOST:5432/DB?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | utilizador Neon |
| `SPRING_DATASOURCE_PASSWORD` | password Neon |
| `HH_JWT_SECRET` | string aleatória ≥ 32 caracteres |
| `HH_CORS_ORIGINS` | `https://seu-app.vercel.app` (sem barra final; pode listar vários separados por vírgula) |

4. **Health check path** (opcional): `/actuator/health` só se activar actuator; caso contrário use o path raiz ou deixe em branco conforme o Render permita.

5. Após o deploy, teste: `https://SUA-API.onrender.com/swagger-ui.html`

> **Nota:** O primeiro arranque pode demorar (cold start no plano gratuito).

### Blueprint (`render.yaml`)

Na raiz do repo existe [`render.yaml`](../render.yaml) de exemplo — ajuste nomes e região; no dashboard do Render pode importar o blueprint.

---

## 3. Frontend na Vercel

1. Importe o repositório na [Vercel](https://vercel.com).
2. **Framework:** Next.js  
3. **Root Directory:** `apps/web` **ou** raiz com comandos:
   - **Install:** `npm ci` (na raiz do monorepo)
   - **Build:** `npm run build -w @hh/web`
   - **Output:** conforme Next (`.next` dentro de `apps/web`)
4. **Environment Variable:**

| Nome | Valor |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://SUA-API.onrender.com` (sem barra final) |

5. Deploy. O URL tipo `https://xxx.vercel.app` deve ser adicionado em **`HH_CORS_ORIGINS`** na API (e redeploy da API se já estiver em produção).

---

## 4. CORS

A API lê **`HH_CORS_ORIGINS`** (lista separada por vírgulas). Deve incluir **exatamente** a origem do browser (protocolo + domínio + porta se aplicável), por exemplo:

```text
https://hh-financeiro.vercel.app,https://hh-financeiro-git-main-seuuser.vercel.app
```

Desenvolvimento local continua a funcionar com o default em `application.yml` ou:

```text
HH_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## Alternativas

| Serviço | Papel |
|---------|--------|
| **Railway** | Postgres + API + web num único projeto (menos peças) |
| **Fly.io** | API em contentor; boa doc para Spring |
| **Supabase** | Postgres gerido (substitui Neon) |
| **Netlify** | Similar ao Vercel para o Next.js |

---

## Checklist final

- [ ] API responde e Swagger abre.
- [ ] Login no site público cria sessão (token) e o dashboard carrega.
- [ ] CORS sem erros na consola do browser.
- [ ] `README.md` na raiz atualizado com os **links reais** da demo.
