<div align="center">

<img src="https://img.shields.io/badge/versão-5.0-d4a843?style=for-the-badge&labelColor=0a0d14" alt="Versão 5.0"/>
<img src="https://img.shields.io/badge/PWA-instalável-22c55e?style=for-the-badge&labelColor=0a0d14" alt="PWA"/>
<img src="https://img.shields.io/badge/criptografia-AES--GCM_256-60a5fa?style=for-the-badge&labelColor=0a0d14" alt="AES-GCM 256"/>
<img src="https://img.shields.io/badge/PBKDF2-600k_iterações-a78bfa?style=for-the-badge&labelColor=0a0d14" alt="PBKDF2"/>
<img src="https://img.shields.io/badge/licença-MIT-f87171?style=for-the-badge&labelColor=0a0d14" alt="MIT"/>

<br/><br/>

# 💰 H & H Gestão Financeira

**Controle financeiro pessoal com criptografia de nível bancário.**  
Aplicação web progressiva (PWA) — sem servidor, sem mensalidade, sem nuvem de terceiros.  
Seus dados ficam 100% no seu dispositivo, protegidos por AES-GCM 256-bit.

<br/>

[🚀 Demonstração](#-demonstração) · [📦 Instalação](#-instalação) · [🔐 Segurança](#-segurança) · [🏗 Arquitetura](#-arquitetura) · [📋 Funcionalidades](#-funcionalidades)

</div>

---

## 📸 Screenshots

```
┌─────────────────────────────────────────────────────────────────────┐
│  🔒 Tela de acesso          │  📊 Dashboard principal               │
│                              │                                       │
│   💰                        │  Entradas   Saídas   Invest.  Saldo   │
│  H & H Gestão Financeira    │  R$5.800   R$1.859   R$300   R$3.641  │
│  Versão 5.0                 │                                       │
│                              │  [Gráfico donuts] [Linha 6 meses]    │
│  SENHA DE ACESSO            │                                       │
│  ┌────────────────────┐     │  Lançamentos recentes                 │
│  │   ••••••••         │     │  Supermercado · Alimentação  R$320    │
│  └────────────────────┘     │  Aluguel    · Moradia       R$1.200   │
│  [  🔓 Entrar           ]   │  Salário    · Receita       R$5.000   │
│                              │                                       │
└──────────────────────────────┴───────────────────────────────────────┘
```

> **Nota:** O app possui tema escuro premium com identidade visual dourada (#d4a843), tipografia DM Sans + DM Mono e design responsivo para mobile, tablet e desktop.

---

## 🚀 Demonstração

Por ser um arquivo HTML estático sem backend, você pode abrir diretamente no navegador:

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/hh-gestao-financeira.git

# Entre na pasta da versão 5
cd hh-gestao-financeira/hh_v5

# Abra no navegador (qualquer um desses métodos)
open index.html                    # macOS
xdg-open index.html                # Linux
start index.html                   # Windows
python -m http.server 8080         # Servidor local (recomendado para PWA)
```

> ⚠️ **Para funcionalidade PWA completa** (Service Worker, instalação), use um servidor local (`python -m http.server` ou Live Server do VS Code). Abrir via `file://` funciona para a maioria das features, mas o Service Worker é bloqueado por alguns navegadores neste modo.

**Senha padrão no primeiro acesso:** `1234`  
Altere imediatamente em **🔑 Senha** no menu superior.

---

## 📋 Funcionalidades

### Gestão financeira completa

| Módulo | Descrição |
|--------|-----------|
| **📊 Resumo** | Dashboard com métricas do mês, gráfico de categorias (doughnut) e evolução dos últimos 6 meses (linha) |
| **💸 Despesas** | Lançamento de despesas fixas e variáveis com data, categoria e observação. Busca e filtros por categoria e tipo |
| **💵 Receitas** | Registro de entradas com categorias (Salário, Freelance, Bônus, Investimento) |
| **🎯 Metas** | Metas financeiras com barra de progresso, sistema de depósitos com histórico e alertas de conquista |
| **🔄 Assinaturas** | Controle de serviços recorrentes com **lançamento automático** como despesas fixas a cada mês |
| **📋 Planejamento** | Orçamento mensal por categoria — comparativo Real × Planejado com indicador de estouro |
| **📈 Visão Anual** | Gráfico de barras + linha de saldo para os 12 meses do ano, com totais consolidados |

### Segurança e privacidade

| Feature | Detalhe |
|---------|---------|
| **Criptografia dos dados** | AES-GCM 256-bit via Web Crypto API. Dados ilegíveis sem a senha |
| **Derivação de chave** | PBKDF2-SHA256 com **600.000 iterações** e salt aleatório de 32 bytes por instalação |
| **Hash da senha** | SHA-256 nativo (com fallback JS puro para ambientes `file://`) |
| **Backup criptografado** | Exportação `.hhbak` com salt independente por arquivo — portável entre dispositivos |
| **Proteção XSS** | Função `escHtml()` aplicada em 100% dos dados renderizados via `innerHTML` |
| **Logout seguro** | `AUTH_PASS` limpo da memória ao bloquear |
| **Importação segura** | Validação e sanitização de todos os campos via `normalizarDB()` antes de aceitar dados externos |
| **Limite de importação** | Máximo 5 MB por arquivo — proteção contra DoS |

### Experiência do usuário

- **PWA instalável** — aparece na tela inicial como app nativo (Android/iOS/Desktop)
- **100% offline** — funciona sem internet após primeira abertura (Service Worker cache-first)
- **Salvamento real** — feedback "Salvando..." → "Salvo às HH:MM" com confirmação do IndexedDB
- **Navegação histórica** — seletor de mês e ano para acessar qualquer período
- **Migração automática** — detecta e importa dados de versões anteriores (v2, v3, v4)
- **Responsivo** — sidebar colapsável no mobile, layout adaptado para todas as telas

---

## 🔐 Segurança

### Como os dados são protegidos

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE CRIPTOGRAFIA                            │
│                                                                     │
│  Senha do usuário                                                   │
│       │                                                             │
│       ▼                                                             │
│  PBKDF2-SHA256                                                      │
│  600.000 iterações                                                  │
│  Salt 32 bytes (único por instalação)                               │
│       │                                                             │
│       ▼                                                             │
│  Chave AES-GCM 256-bit ──► Dados do usuário (JSON)                 │
│       │                           │                                 │
│       └──────── encrypt ──────────►                                 │
│                                   │                                 │
│                                   ▼                                 │
│                          { iv, data } criptografados                │
│                                   │                                 │
│                                   ▼                                 │
│                              IndexedDB                              │
│                        (ilegível sem a senha)                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Backup criptografado (.hhbak)

O arquivo de backup usa **salt independente** gerado na hora da exportação e embutido no próprio arquivo. Isso significa:

- ✅ Portável entre dispositivos — não depende do salt de instalação
- ✅ Ilegível sem a senha — nem o criador do app consegue ler
- ✅ Detectado automaticamente na importação pelo campo `magic: "HHv5ENC"`
- ✅ Compatível com backups JSON legados das versões anteriores

### Comparativo de segurança por versão

| Versão | Senha | Dados | Backup | PBKDF2 |
|--------|-------|-------|--------|--------|
| v1 | Texto puro ❌ | localStorage ❌ | JSON legível ❌ | — |
| v2 | SHA-256 ✅ | localStorage ❌ | JSON legível ❌ | — |
| v4 | SHA-256 ✅ | AES-GCM + IndexedDB ✅ | JSON legível ⚠️ | 120k ⚠️ |
| **v5** | **SHA-256 ✅** | **AES-GCM + IndexedDB ✅** | **.hhbak criptografado ✅** | **600k ✅** |

### Referências de segurança

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) — 600k iterações PBKDF2-SHA256
- [W3C Web Crypto API](https://www.w3.org/TR/WebCryptoAPI/) — AES-GCM + PBKDF2
- [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) — Derivação de chave com salt

---

## 🏗 Arquitetura

### Visão geral do sistema

```
┌──────────────────────────────────────────────────────────────────────┐
│                    H & H GESTÃO FINANCEIRA v5                        │
│                    Aplicação 100% client-side                        │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
   ┌─────────────┐ ┌──────────┐ ┌──────────────┐
   │  index.html │ │ style.css│ │manifest.json │
   │  (estrutura)│ │ (design) │ │  (PWA meta)  │
   └──────┬──────┘ └──────────┘ └──────────────┘
          │
          │ carrega em ordem
          │
   ┌──────▼──────┐
   │ security.js │  ← AES-GCM · PBKDF2 · backup criptografado
   └──────┬──────┘
          │
   ┌──────▼──────┐
   │    db.js    │  ← IndexedDB · conexão reutilizada · erros explícitos
   └──────┬──────┘
          │
   ┌──────▼──────┐
   │   app.js    │  ← lógica · auth · CRUD · render · gráficos
   └──────┬──────┘
          │
   ┌──────▼──────────────────────┐
   │    service-worker.js        │  ← cache offline · PWA
   └─────────────────────────────┘
```

### Estrutura de arquivos

```
hh_v5/
│
├── index.html           # Estrutura HTML — lock screen + app + 5 modais
├── style.css            # Design system completo — tema escuro + variáveis CSS
│
├── security.js          # Criptografia
│   ├── generateKey()    # PBKDF2-SHA256 · 600k iter · salt 32 bytes
│   ├── encryptData()    # AES-GCM 256-bit · IV aleatório por operação
│   ├── decryptData()    # Descriptografia com verificação de integridade
│   ├── exportarCriptografado()   # Backup .hhbak com salt próprio
│   └── importarCriptografado()   # Importação segura com validação de magic
│
├── db.js                # Persistência
│   ├── openDB()         # Abre IndexedDB · reutiliza conexão (_dbConn)
│   ├── saveDB()         # Grava payload criptografado · propaga erros
│   └── loadDB()         # Carrega payload · retorna {} se vazio
│
├── app.js               # Lógica principal (11 seções)
│   ├── [Constantes]     # MESES, CATS_D, CATS_R, CORES, chaves
│   ├── [Estado global]  # AUTH_PASS, DB, curMes, curAno, nextId
│   ├── [Utilitários]    # escHtml, fmt, fmtD, num, safeMes, safeAno
│   ├── [SHA-256]        # hashS() — Web Crypto + fallback JS puro
│   ├── [Persistência]   # loadPersistedDB, savePersistedDB, initAfterAuth
│   ├── [salvar()]       # async/await real · "Salvando..." → "Salvo às HH:MM"
│   ├── [Autenticação]   # entrar, bloquear, abrirSenha, salvarSenha
│   ├── [Backup]         # exportar (.hhbak) · importar (.hhbak + .json legado)
│   ├── [Dados]          # normalizarDB · _dadosDemostracao · aplicarAssinaturas
│   ├── [Render]         # render + rResumo/Despesas/Receitas/Metas/Anual...
│   └── [CRUD]           # del, editarItem, abrirModal, salvarModal, abrirDep...
│
├── service-worker.js    # PWA offline — cache-first assets · network-first docs
├── manifest.json        # Metadados PWA — standalone · tema escuro · ícones
└── icons/
    ├── icon-192.svg     # Ícone PWA 192×192
    └── icon-512.svg     # Ícone PWA 512×512
```

### Fluxo de autenticação

```
Usuário abre o app
       │
       ▼
Existe hash de senha   ──── NÃO ───► Modal "Criar senha"
no localStorage?                           │
       │ SIM                               ▼
       ▼                          hashS(nova senha)
Digite a senha                     localStorage.setItem()
       │                                   │
       ▼                                   ▼
hashS(entrada) === hash?  ──NÃO──► "Senha incorreta" + shake
       │ SIM
       ▼
initAfterAuth(senha)
  ├── loadPersistedDB()  → decryptData() → IndexedDB
  ├── normalizarDB()     → sanitiza todos os campos
  └── savePersistedDB()  → encryptData() → IndexedDB
       │
       ▼
aplicarAssinaturas()    → lança assinaturas do mês se necessário
       │
       ▼
render()                → atualiza toda a UI
```

### Fluxo de salvar (async/await real)

```
Usuário faz uma ação (add/edit/delete)
            │
            ▼
   sidebar: "Salvando..."
            │
            ▼
   encryptData(AUTH_PASS, DB)
   ├── generateKey() — PBKDF2 600k iter
   └── crypto.subtle.encrypt() — AES-GCM
            │
            ▼
   saveDB({ enc: payload })
   └── IndexedDB.transaction('readwrite').put()
            │
       ┌────┴─────┐
     ERRO       SUCESSO
       │           │
       ▼           ▼
  "Erro ao     "Salvo às
   salvar"      HH:MM"
  + toast
```

### Schema de dados (IndexedDB)

```javascript
// Estrutura armazenada no IndexedDB (após criptografia AES-GCM)
{
  enc: {
    iv:   [12 bytes aleatórios],   // IV único por operação
    data: [bytes cifrados]          // JSON do DB criptografado
  }
}

// Estrutura do DB descriptografado
{
  despesas: [
    { id, desc, valor, cat, tipo, mes, ano, data, obs, assinId? }
  ],
  receitas: [
    { id, desc, valor, cat, mes, ano, data, obs }
  ],
  metas: [
    { id, desc, alvo, atual, historico: [{ val, data }] }
  ],
  assinaturas: [
    { id, desc, valor, cat }
  ],
  planejado: {
    "Alimentação": 800,
    "Transporte": 300,
    // ... demais categorias
  },
  assinLancadas: ["2026-2", "2026-3"]   // meses já processados
}
```

---

## 🛠 Tecnologias

### Core

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| HTML5 | — | Estrutura semântica com 5 modais |
| CSS3 | — | Design system com variáveis CSS · animações · responsividade |
| JavaScript | ES2022 | Lógica principal · async/await · optional chaining |
| Web Crypto API | nativo | AES-GCM · PBKDF2 · SHA-256 |
| IndexedDB | nativo | Persistência local estruturada |
| Service Worker | nativo | Cache offline · PWA |

### Bibliotecas

| Biblioteca | Versão | Uso |
|-----------|--------|-----|
| [Chart.js](https://www.chartjs.org/) | 4.4.1 | Gráficos doughnut, linha e barra |
| [DM Sans](https://fonts.google.com/specimen/DM+Sans) | Google Fonts | Tipografia principal |
| [DM Mono](https://fonts.google.com/specimen/DM+Mono) | Google Fonts | Valores monetários |

### Sem dependências de runtime

O projeto **não usa** npm, Node.js, bundlers, frameworks ou CDNs de dados — exceto Chart.js (também cacheado offline pelo Service Worker). É HTML + CSS + JS puros.

---

## 📦 Instalação

### Método 1 — Download direto (recomendado)

1. Baixe o arquivo `hh-gestao-financeira-v5.zip`
2. Extraia em qualquer pasta
3. Abra `index.html` no navegador
4. Na primeira abertura, clique em "Criar senha" e defina sua senha pessoal

### Método 2 — Git clone

```bash
git clone https://github.com/seu-usuario/hh-gestao-financeira.git
cd hh-gestao-financeira/hh_v5

# Para PWA completa, use um servidor local:
python3 -m http.server 8080
# Acesse: http://localhost:8080
```

### Método 3 — Live Server (VS Code)

1. Instale a extensão **Live Server** no VS Code
2. Abra a pasta `hh_v5/` no VS Code
3. Clique em "Go Live" na barra inferior
4. O navegador abrirá automaticamente com hot-reload

### Instalação como PWA (Android / iOS / Desktop)

Após abrir via servidor local ou URL hospedada:

**Android (Chrome):** Menu ⋮ → "Adicionar à tela inicial"  
**iOS (Safari):** Botão compartilhar → "Adicionar à tela de início"  
**Desktop (Chrome/Edge):** Ícone de instalação na barra de endereços

---

## 🔄 Migração de versões anteriores

O app detecta e migra automaticamente dados de versões anteriores:

| Versão origem | Chave localStorage | Suporte |
|-------------|-------------------|---------|
| v2 | `hh_v2_dados` | ✅ Migração automática |
| v3 | `hh_v2_dados` | ✅ Migração automática |
| v4 | `hh_v4_dados_migracao` | ✅ Migração automática |
| v5 | IndexedDB criptografado | — Versão atual |

Para migrar manualmente dados de qualquer versão:
1. Exporte um backup `.hhbak` (ou `.json` em versões antigas) na versão atual
2. Abra a v5 e faça login com uma senha nova
3. Clique em **⬆ Importar** e selecione o arquivo de backup

---

## 💾 Backup e restauração

### Exportar backup criptografado

1. Clique em **⬇ Backup** no menu superior
2. Digite sua senha quando solicitado
3. Um arquivo `.hhbak` será baixado automaticamente

O arquivo `.hhbak` é um JSON com estrutura:
```json
{
  "magic": "HHv5ENC",
  "salt_b64": "<salt 32 bytes em base64>",
  "iv_b64": "<IV 12 bytes em base64>",
  "data_b64": "<dados criptografados AES-GCM em base64>"
}
```

### Importar backup

1. Clique em **⬆ Importar**
2. Selecione o arquivo `.hhbak` (criptografado) ou `.json` (legado)
3. Se `.hhbak`, informe a senha usada na exportação
4. Os dados serão validados e importados com segurança

---

## 🗂 Categorias disponíveis

### Despesas
`Alimentação` · `Transporte` · `Saúde` · `Lazer` · `Moradia` · `Educação` · `Investimento` · `Outros`

### Receitas
`Salário` · `Freelance` · `Investimento` · `Bônus` · `Outros`

> Despesas da categoria **Investimento** são contabilizadas separadamente no card "Investido" e não entram no cálculo de "Saídas", permitindo visualização mais precisa do fluxo de caixa real.

---

## 📊 Gráficos e visualizações

| Gráfico | Localização | Tipo | Dados |
|---------|-------------|------|-------|
| Gastos por categoria | Aba Resumo | Doughnut | Despesas do mês agrupadas |
| Evolução mensal | Aba Resumo | Linha com área | Entradas vs Saídas últimos 6 meses |
| Saldo anual | Aba Visão Anual | Barras + linha | Entradas/Saídas por mês + saldo acumulado |
| Real × Planejado | Aba Planejamento | Barras de progresso | Gasto real vs orçamento definido |
| Progresso de metas | Aba Metas | Barras de progresso | Percentual atingido por meta |

---

## 🔧 Variáveis e configurações

### Constantes principais em `app.js`

```javascript
const KEY_PASS         = 'hh_v5_senha';         // chave do hash no localStorage
const LEGACY_KEY_PASS  = 'hh_v2_senha';          // compatibilidade versões antigas
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;        // limite de importação: 5 MB
```

### Constantes em `security.js`

```javascript
const PBKDF2_ITERATIONS = 600_000;   // iterações PBKDF2 (OWASP 2023)
const BACKUP_MAGIC      = 'HHv5ENC'; // marcador de arquivo .hhbak
// Salt de instalação: 32 bytes aleatórios (gerado uma vez, salvo no localStorage)
```

### Cache do Service Worker

```javascript
const CACHE_NAME = 'hh-v5-cache-1';
// Incrementar ao alterar qualquer arquivo para forçar atualização nos clientes
```

---

## 🧪 Qualidade do código

### Práticas implementadas

- **JSDoc** em todas as funções públicas com contrato documentado
- **11 seções comentadas** em `app.js` para navegação rápida
- **`try/catch` individual** por aba de render — um erro não quebra outras seções
- **`escHtml()`** em 100% das inserções via `innerHTML` — proteção XSS
- **`normalizarDB()`** — sanitização completa de dados importados campo a campo
- **`salvar()` async/await** — feedback visual honesto com confirmação real do IndexedDB
- **Conexão IndexedDB reutilizada** — `_dbConn` cached em `db.js`
- **Erros propagados** — zero `.catch(()=>{})` silencioso nas operações de persistência

### Cobertura de segurança

```
Entrada de dados do usuário ──► escHtml() ──► innerHTML       ✅ XSS
Importação de arquivo       ──► normalizarDB() ──► DB         ✅ Injeção de dados
Persistência local          ──► AES-GCM ──► IndexedDB         ✅ Acesso direto ao DB
Backup exportado            ──► AES-GCM + salt próprio         ✅ Portabilidade segura
Autenticação                ──► SHA-256 + PBKDF2 600k          ✅ Brute-force
Logout                      ──► AUTH_PASS = null               ✅ Senha em memória
Tamanho de importação       ──► f.size > MAX_IMPORT_BYTES      ✅ DoS por arquivo
```

---

## 🚧 Roadmap

### v6 — Planejado

- [ ] **Modal próprio** para senha do backup (substituir `window.prompt()`)
- [ ] **Auto-lock por inatividade** — bloquear após X minutos sem interação
- [ ] **Modo claro** com `prefers-color-scheme` + toggle manual
- [ ] **Exportação PDF** do resumo mensal via `@media print`
- [ ] **Separação de módulos** — `auth.js`, `store.js`, `render.js`, `charts.js`
- [ ] **Testes unitários** para `normalizarDB()`, cálculos e `escHtml()`
- [ ] **Toast de erro** no `aplicarAssinaturas()` fire-and-forget

### v7 — Full-Stack (planejado)

- [ ] **Backend Spring Boot** — API REST + Spring Security + JWT
- [ ] **Frontend React + Next.js** — Tailwind CSS + React Query
- [ ] **PostgreSQL** — dados sincronizados na nuvem
- [ ] **Deploy público** — Vercel (frontend) + Render (backend) + Supabase (banco)
- [ ] **README com screenshots reais** e vídeo de demonstração

---

## 📁 Histórico de versões

| Versão | Destaques |
|--------|-----------|
| **v5** | Backup criptografado `.hhbak` · `salvar()` async/await real · PBKDF2 600k iter · salt 32 bytes · refactor completo com JSDoc |
| **v4** | AES-GCM 256-bit · IndexedDB · PWA instalável · proteção XSS · migração automática de dados |
| **v2** | SHA-256 · edição de lançamentos · busca e filtros · metas com depósito · visão anual · assinaturas automáticas |
| **v1** | Arquivo HTML único · localStorage · 6 abas · gráficos Chart.js |

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-melhoria`
3. Faça suas alterações com testes manuais
4. Commit: `git commit -m 'feat: adiciona X melhoria'`
5. Push: `git push origin feature/minha-melhoria`
6. Abra um Pull Request descrevendo a mudança

### Convenção de commits

```
feat:     nova funcionalidade
fix:      correção de bug
security: melhoria de segurança
perf:     melhoria de performance
docs:     atualização de documentação
refactor: refatoração sem mudança de comportamento
```

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

## ⚠️ Aviso importante

Este aplicativo **não é uma ferramenta de contabilidade profissional** e não deve ser usado para fins fiscais, legais ou contábeis formais. É uma ferramenta de organização financeira pessoal.

Os dados são armazenados **localmente no seu dispositivo**. Limpar os dados do navegador (cookies/cache) apagará os dados. Faça backups regulares usando o botão **⬇ Backup**.

---

<div align="center">

Feito com 💰 para controle financeiro pessoal seguro

**H & H Gestão Financeira v5** · Vanilla JS · AES-GCM 256-bit · PWA

</div>
