# Passo a passo (nível júnior) — o que falta fazer **fora** do código

Este guia complementa o que já está no repositório (API, web, testes, [DEPLOY.md](DEPLOY.md)). Siga na ordem; cada passo depende pouco do anterior, exceto onde indicado.

---

## 1. Colocar a API e a base de dados online

1. Crie uma conta no serviço que escolheu (ex.: **Render**, **Railway**, **Fly.io**) e, se precisar de Postgres gerido, no **Neon** ou equivalente.
2. Crie uma **base de dados PostgreSQL** e anote: host, porta, nome da base, utilizador, palavra-passe.
3. Monte o **JDBC** para a API (exemplo Neon — ajuste host, db, user, password): `jdbc:postgresql://HOST.neon.tech/DB?sslmode=require`
4. **Web Service no Render (Docker)** — alinhado ao repo: **New → Blueprint** com o [`render.yaml`](../render.yaml) *ou* **New → Web Service** → GitHub → Docker com `Dockerfile path` = `apps/api/Dockerfile`, **Docker context** = `apps/api` (passo a passo em [DEPLOY.md](DEPLOY.md)).
5. No painel do serviço, defina as variáveis de ambiente (nunca commite valores reais):
   - `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` (ou o formato que o `DEPLOY.md` do projeto indicar).
   - `HH_JWT_SECRET` — mínimo 32 caracteres aleatórios.
   - `HH_CORS_ORIGINS` — URL do seu frontend em produção (ex.: `https://xxx.vercel.app`).
   - Opcional: `OPENAI_API_KEY` — se quiser análise com modelo na rota `/api/v1/insights/monthly-analysis` (modo `OPENAI` em vez de `RULE_BASED`).
6. Faça **deploy** e espere o healthcheck ficar verde (**path:** `/actuator/health`).
7. Confirme no browser: `https://SEU-HOST/actuator/health` (deve mostrar `"status":"UP"`) e `https://SEU-HOST/swagger-ui.html`.

**Critério de pronto:** URL da API + Swagger acessíveis de fora da sua máquina.

---

## 2. Colocar o frontend (Next.js) online

1. Crie uma conta na **Vercel** (ou Netlify) e importe o mesmo repositório.
2. **Root directory:** `apps/web` (ou o que o assistente de deploy pedir).
3. Variável de ambiente: `NEXT_PUBLIC_API_URL=https://SEU-HOST-API` (sem barra no fim).
4. Deploy e teste login/registo contra a API em produção.

**Critério de pronto:** abrir o site público, registar utilizador e ver o resumo do mês.

---

## 3. Atualizar o README com links reais

1. No [README.md](../README.md), na secção **Demo online**, substitua os placeholders pelos URLs:
   - App (Vercel).
   - API Swagger.
2. Faça **commit** e **push** para o branch principal.

**Critério de pronto:** qualquer pessoa clica e abre app + API sem perguntar a você.

---

## 4. GitHub: perfil e pins

1. **Pin** no máximo 3–4 repositórios; coloque **Gestão Financeira** em primeiro.
2. **README do perfil** (`username/username`): copie/adapte o texto do seu ficheiro de rascunho (ex.: `workspace/HelderAbud-github-profile-README.md`) com uma linha que aponte para este repo e para a demo online.
3. **Descrição** da organização do repo: uma frase com **valor** (não só “Java Spring”).

**Critério de pronto:** perfil em 10 segundos mostra stack + link para o projeto âncora.

---

## 5. Segurança (checklist rápido)

- [ ] Nunca commitar `.env` com segredos.
- [ ] Rotação da `OPENAI_API_KEY` se foi exposta por engano.
- [ ] `HH_CORS_ORIGINS` só com o domínio do front em produção.

---

## 6. LinkedIn (opcional mas forte)

1. Use o bloco **“Resumo para LinkedIn”** no README.
2. Publique um post com: problema → solução → link para o repo → link demo → 1 tecnologia que aprendeu.
3. (Opcional) Grave um vídeo curto (30–60 s) a mostrar o dashboard e a análise do mês.

---

## Ordem mínima recomendada

1. API + DB online → Swagger OK  
2. Front online → `NEXT_PUBLIC_API_URL` correto  
3. README com links  
4. README do perfil + pins  
5. Post LinkedIn  

---

## Se algo falhar

- **CORS:** confira `HH_CORS_ORIGINS` e o URL exato do front (com `https`).
- **401 no front:** confirme que `NEXT_PUBLIC_API_URL` aponta para a API certa e que o JWT não está a ser bloqueado por mistura de HTTP/HTTPS.
- **IA sempre em modo automático:** confirme `OPENAI_API_KEY` no **serviço da API** (não só no PC local).

---

*Documento gerado para acompanhar o monorepo `hh-financeiro-v6`.*
