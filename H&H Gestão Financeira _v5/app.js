// app.js — v5
// Melhorias v5:
//   • salvar() é agora totalmente async/await com feedback real de sucesso/falha
//   • Backup criptografado via exportarCriptografado() / importarCriptografado()
//   • Importação dupla: aceita backup criptografado (.hhbak) OU JSON legado
//   • Indicador de "Salvando..." visível até confirmação do IndexedDB
//   • Separação clara por seções comentadas
//   • Nenhum .catch(()=>{}) silencioso nas operações de persistência
//   • PBKDF2 agora em 600.000 iterações (via security.js v5)

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const MESES    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const CATS_D   = ['Alimentação','Transporte','Saúde','Lazer','Moradia','Educação','Investimento','Outros'];
const CATS_R   = ['Salário','Freelance','Investimento','Bônus','Outros'];
const CORES    = {
  Alimentação:'#f87171', Transporte:'#60a5fa', Saúde:'#34d399',    Lazer:'#f472b6',
  Moradia:'#a78bfa',    Educação:'#fbbf24',   Investimento:'#2dd4bf', Salário:'#22c55e',
  Freelance:'#86efac',  Bônus:'#fcd34d',      Outros:'#94a3b8',
};

const KEY_PASS        = 'hh_v5_senha';
const LEGACY_KEY_PASS = 'hh_v2_senha';
const LEGACY_LS_KEY   = 'hh_v2_dados';
const MAX_IMPORT_BYTES = 5 * 1024 * 1024; // 5 MB

// ═══════════════════════════════════════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════════════════════════════════════

let AUTH_PASS  = null;   // senha em memória após autenticação
let DB         = null;   // objeto de dados
let now        = new Date();
let curMes     = now.getMonth();
let curAno     = now.getFullYear();
let modalMode  = '';
let editId     = null;
let depMetaId  = null;
let nextId     = Date.now();
let catCI      = null;
let evolCI     = null;
let yearCI     = null;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS GERAIS
// ═══════════════════════════════════════════════════════════════════════════════

/** Escapa HTML para evitar XSS em conteúdo inserido via innerHTML. */
function escHtml(s) {
  const v = s == null ? '' : String(s);
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Converte para número finito, retornando `def` se inválido. */
function num(v, def = 0) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : def;
}

/** Limpa e clampeia um percentual entre 0 e 100. */
function clampPct(pct) {
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** Calcula percentual de progresso de uma meta. */
function pctFromParts(atual, alvo) {
  if (num(alvo, 0) <= 0) return num(atual, 0) > 0 ? 100 : 0;
  return clampPct((num(atual, 0) / num(alvo, 0)) * 100);
}

/** Formata valor como moeda BRL. */
function fmt(v) {
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Formata data ISO (YYYY-MM-DD) para exibição (DD/MM). */
function fmtD(s) {
  if (!s) return '';
  try {
    const [, m, d] = s.split('-');
    return `${d}/${m}`;
  } catch {
    return s;
  }
}

/** Exibe mensagem toast temporária. */
function toast(msg, ms = 2600) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

/** Exibe erro na tela de lock (útil antes do app carregar). */
function showLockError(msg) {
  try {
    const el = document.getElementById('lock-err');
    if (el) el.textContent = String(msg || '');
  } catch { /* ignora — DOM pode não estar pronto */ }
}

/** Valida mês entre 0 e 11. */
function safeMes(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(11, n)) : curMes;
}

/** Valida ano entre 1900 e 2100. */
function safeAno(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.max(1900, Math.min(2100, n)) : curAno;
}

/** Garante string não-nula. */
function normalizarTexto(v) { return v == null ? '' : String(v); }

// ═══════════════════════════════════════════════════════════════════════════════
// TRATAMENTO DE ERROS GLOBAIS
// ═══════════════════════════════════════════════════════════════════════════════

window.addEventListener('error', e => {
  showLockError('Erro JS: ' + (e?.message || 'desconhecido'));
});
window.addEventListener('unhandledrejection', e => {
  const r = e?.reason;
  showLockError('Erro assíncrono: ' + (r?.message || (r ? String(r) : 'desconhecido')));
});

// ═══════════════════════════════════════════════════════════════════════════════
// SHA-256 (WebCrypto + fallback JS puro para file://)
// ═══════════════════════════════════════════════════════════════════════════════

function utf8Encode(str) {
  return unescape(encodeURIComponent(str));
}

function sha256Fallback(ascii) {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];

  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  const ch   = (x, y, z) => (x & y) ^ (~x & z);
  const maj  = (x, y, z) => (x & y) ^ (x & z) ^ (y & z);
  const sig0 = x => rotr(x, 2)  ^ rotr(x, 13) ^ rotr(x, 22);
  const sig1 = x => rotr(x, 6)  ^ rotr(x, 11) ^ rotr(x, 25);
  const gam0 = x => rotr(x, 7)  ^ rotr(x, 18) ^ (x >>> 3);
  const gam1 = x => rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10);

  const str = utf8Encode(String(ascii));
  const l   = str.length;
  const bytes = Array.from({ length: l }, (_, i) => str.charCodeAt(i));
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0x00);

  const hi = Math.floor((l * 8) / 0x100000000);
  const lo = (l * 8) >>> 0;
  bytes.push((hi>>>24)&0xff,(hi>>>16)&0xff,(hi>>>8)&0xff,hi&0xff);
  bytes.push((lo>>>24)&0xff,(lo>>>16)&0xff,(lo>>>8)&0xff,lo&0xff);

  let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const W = new Array(64);

  for (let i = 0; i < bytes.length; i += 64) {
    for (let t = 0; t < 16; t++) {
      const j = i + t * 4;
      W[t] = ((bytes[j] << 24) | (bytes[j+1] << 16) | (bytes[j+2] << 8) | bytes[j+3]) >>> 0;
    }
    for (let t = 16; t < 64; t++) W[t] = (gam1(W[t-2]) + W[t-7] + gam0(W[t-15]) + W[t-16]) >>> 0;

    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const T1 = (h + sig1(e) + ch(e,f,g) + K[t] + W[t]) >>> 0;
      const T2 = (sig0(a) + maj(a,b,c)) >>> 0;
      [h, g, f, e, d, c, b, a] = [g, f, e, (d+T1)>>>0, c, b, a, (T1+T2)>>>0];
    }
    H = H.map((v, i) => (v + [a,b,c,d,e,f,g,h][i]) >>> 0);
  }

  return H.map(x => x.toString(16).padStart(8, '0')).join('');
}

async function hashS(s) {
  const v = String(s);
  if (window.crypto?.subtle && window.TextEncoder) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
    return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('');
  }
  return sha256Fallback(v);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECÇÃO DE CAPACIDADES
// ═══════════════════════════════════════════════════════════════════════════════

function canSecure() {
  return !!(
    window.crypto?.subtle &&
    typeof encryptData    === 'function' &&
    typeof decryptData    === 'function' &&
    typeof saveDB         === 'function' &&
    typeof loadDB         === 'function'
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTÊNCIA (IndexedDB + AES-GCM / fallback localStorage)
// ═══════════════════════════════════════════════════════════════════════════════

/** Carrega dados descriptografados do IndexedDB (ou fallback). */
async function loadPersistedDB(pass) {
  if (!canSecure()) {
    return _legacyLocalStorageLoad();
  }
  const stored = await loadDB();
  if (stored?.enc) {
    return await decryptData(pass, stored.enc);
  }
  // Primeira abertura ou migração: tenta carregar dados legados em texto plano.
  return _legacyLocalStorageLoad();
}

/** Criptografa e salva no IndexedDB. Propaga erros — não silencia. */
async function savePersistedDB(pass) {
  if (!pass) throw new Error('savePersistedDB: senha não definida.');

  if (!canSecure()) {
    // Fallback: salva em localStorage sem criptografia (ambientes sem WebCrypto).
    try {
      localStorage.setItem('hh_v5_dados_fallback', JSON.stringify(DB));
    } catch (e) {
      throw new Error('Falha ao salvar no localStorage: ' + e.message);
    }
    return;
  }

  const enc = await encryptData(pass, DB);
  await saveDB({ enc }); // lança Error se IndexedDB falhar
}

function _legacyLocalStorageLoad() {
  try {
    const r = localStorage.getItem(LEGACY_LS_KEY);
    if (r) return JSON.parse(r);
  } catch { /* ignora dados corrompidos */ }
  return null;
}

/** Inicializa o DB após autenticação bem-sucedida. */
async function initAfterAuth(pass) {
  AUTH_PASS = pass;
  const loaded = await loadPersistedDB(pass);
  DB = normalizarDB(loaded && typeof loaded === 'object' ? loaded : _dadosDemostracao());
  // Persiste imediatamente para garantir que o DB está na versão correta.
  await savePersistedDB(pass);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SALVAR COM FEEDBACK REAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Salva o DB com feedback visual correto:
 *  - Mostra "Salvando..." imediatamente
 *  - Aguarda confirmação real do IndexedDB
 *  - Mostra "Salvo às HH:MM" em caso de sucesso
 *  - Mostra erro toast em caso de falha
 */
async function salvar() {
  const el = document.getElementById('save-txt');
  if (el) el.textContent = 'Salvando...';

  try {
    if (AUTH_PASS) {
      await savePersistedDB(AUTH_PASS);
    } else {
      // Estado pré-auth: não salva dados financeiros sem criptografia.
      return;
    }
    if (el) {
      const t = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      el.textContent = 'Salvo às ' + t;
    }
  } catch (e) {
    if (el) el.textContent = 'Erro ao salvar';
    toast('⚠ Falha ao salvar: ' + (e?.message || 'erro desconhecido'));
    console.error('[HH v5] salvar():', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTENTICAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

async function getSH() {
  return localStorage.getItem(KEY_PASS) || localStorage.getItem(LEGACY_KEY_PASS) || null;
}

async function entrar() {
  const inp = document.getElementById('lock-inp');
  const err = document.getElementById('lock-err');
  const v   = inp.value;
  err.textContent = '';

  try {
    const storedHash = await getSH();

    if (!storedHash) {
      // Nenhuma senha definida: abre fluxo de criação.
      err.textContent = 'Defina sua senha antes de entrar.';
      await abrirSenha(true);
      return;
    }

    if ((await hashS(v)) === storedHash) {
      // Migra hash legado para a chave v5 se necessário.
      if (!localStorage.getItem(KEY_PASS)) {
        try { localStorage.setItem(KEY_PASS, storedHash); } catch { /* ignora */ }
      }

      inp.value = '';
      err.textContent = '';
      document.getElementById('lock').classList.add('hidden');
      document.getElementById('app').classList.add('visible');

      await initAfterAuth(v);
      aplicarAssinaturas();
      render();
    } else {
      err.textContent = '❌ Senha incorreta.';
      inp.classList.add('err');
      inp.value = '';
      setTimeout(() => { inp.classList.remove('err'); inp.focus(); }, 400);
    }
  } catch (e) {
    err.textContent = 'Erro ao autenticar: ' + (e?.message || String(e));
    inp.classList.add('err');
    inp.value = '';
    setTimeout(() => { inp.classList.remove('err'); inp.focus(); }, 400);
  }
}

function bloquear() {
  AUTH_PASS = null;
  document.getElementById('app').classList.remove('visible');
  document.getElementById('lock').classList.remove('hidden');
  document.getElementById('lock-inp').value = '';
  document.getElementById('lock-err').textContent = '';
  setTimeout(() => document.getElementById('lock-inp').focus(), 200);
}

async function abrirSenha(primeiraVez = false) {
  try {
    ['s-atual', 's-nova', 's-conf'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const sErr = document.getElementById('s-err');
    if (sErr) sErr.textContent = '';

    const storedHash = primeiraVez ? null : await getSH();
    const titulo = document.getElementById('senha-titulo');
    const isPrimeira = primeiraVez || !storedHash;

    if (titulo) titulo.textContent = isPrimeira ? '🔑 Criar senha' : '🔑 Alterar senha';

    // Esconde campo "senha atual" na criação inicial
    const gAtual = document.getElementById('g-s-atual');
    if (gAtual) gAtual.style.display = isPrimeira ? 'none' : 'block';

    document.getElementById('mo-senha').classList.add('open');
    setTimeout(() => {
      const focus = isPrimeira ? 's-nova' : 's-atual';
      document.getElementById(focus)?.focus();
    }, 120);
  } catch (e) {
    showLockError('Erro ao abrir senha: ' + (e?.message || e));
  }
}

function fecharSenha() {
  document.getElementById('mo-senha').classList.remove('open');
}

async function salvarSenha() {
  const a   = document.getElementById('s-atual').value;
  const n   = document.getElementById('s-nova').value;
  const c   = document.getElementById('s-conf').value;
  const er  = document.getElementById('s-err');
  er.textContent = '';

  let storedHash;
  try {
    storedHash = await getSH();
  } catch (e) {
    er.textContent = 'Erro ao acessar senha salva.';
    return;
  }

  const isPrimeira = !storedHash;

  if (!isPrimeira) {
    try {
      if ((await hashS(a)) !== storedHash) {
        er.textContent = 'Senha atual incorreta.';
        return;
      }
    } catch (e) {
      er.textContent = 'Erro criptográfico ao validar senha atual.';
      return;
    }
  }

  if (n.length < 4) {
    er.textContent = isPrimeira
      ? 'Crie uma senha com pelo menos 4 caracteres.'
      : 'Nova senha deve ter pelo menos 4 caracteres.';
    return;
  }
  if (n !== c) { er.textContent = 'As senhas não coincidem.'; return; }

  // Re-criptografa dados com nova senha se já havia senha.
  if (!isPrimeira && AUTH_PASS) {
    try {
      const loaded = await loadPersistedDB(a);
      if (loaded && typeof loaded === 'object') DB = normalizarDB(loaded);
    } catch { /* mantém DB em memória se falhar */ }
  }

  try {
    localStorage.setItem(KEY_PASS, await hashS(n));
  } catch (e) {
    er.textContent = 'Erro ao gravar senha. localStorage bloqueado?';
    return;
  }

  fecharSenha();

  AUTH_PASS = n;
  await salvar(); // salva com nova chave

  toast(isPrimeira ? '✅ Senha criada com sucesso!' : '✅ Senha alterada com sucesso!');

  // Auto-login após criar senha
  document.getElementById('lock').classList.add('hidden');
  document.getElementById('app').classList.add('visible');
  aplicarAssinaturas();
  render();
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKUP — EXPORTAR / IMPORTAR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Exporta backup criptografado (.hhbak).
 * A senha solicitada pode ser diferente da senha do app —
 * útil para compartilhar o arquivo com um parceiro com outra senha.
 */
async function exportar() {
  // Pede confirmação de senha para assinar o backup
  const senhaBackup = window.prompt(
    'Digite sua senha para gerar o backup criptografado:\n(O arquivo só poderá ser aberto com esta senha)'
  );
  if (senhaBackup === null) return; // cancelado

  const storedHash = await getSH();
  if (!storedHash || (await hashS(senhaBackup)) !== storedHash) {
    toast('⚠ Senha incorreta — backup não gerado.');
    return;
  }

  try {
    const payload = await exportarCriptografado(senhaBackup, DB);
    const blob    = new Blob([payload], { type: 'application/json' });
    const a       = document.createElement('a');
    a.href        = URL.createObjectURL(blob);
    a.download    = 'HH_v5_backup_' + new Date().toISOString().slice(0, 10) + '.hhbak';
    a.click();
    toast('✅ Backup criptografado exportado!');
  } catch (e) {
    toast('⚠ Erro ao exportar backup: ' + (e?.message || e));
  }
}

/**
 * Importa arquivo de backup:
 *   - .hhbak  → backup criptografado (v5)
 *   - .json   → backup legado em texto plano (v2/v3/v4)
 */
async function importar(e) {
  const f = e.target.files[0];
  e.target.value = ''; // limpa input para permitir re-importar o mesmo arquivo
  if (!f) return;

  if (f.size > MAX_IMPORT_BYTES) {
    toast('⚠ Arquivo muito grande (máx. 5 MB).');
    return;
  }

  const texto = await f.text().catch(() => null);
  if (!texto) { toast('⚠ Não foi possível ler o arquivo.'); return; }

  // Detecta tipo de backup pelo nome e conteúdo
  const isEncrypted = f.name.endsWith('.hhbak') || texto.includes('"magic":"HHv5ENC"');

  if (isEncrypted) {
    const senhaBackup = window.prompt('Este backup está criptografado.\nDigite a senha usada ao exportar:');
    if (senhaBackup === null) return;

    try {
      const dados = await importarCriptografado(senhaBackup, texto);
      DB = normalizarDB(dados);
      await salvar();
      aplicarAssinaturas();
      render();
      toast('✅ Backup criptografado importado com sucesso!');
    } catch (err) {
      toast('⚠ ' + (err?.message || 'Falha ao importar backup criptografado.'));
    }
    return;
  }

  // Backup legado (JSON em texto plano)
  try {
    const parsed = JSON.parse(texto);
    DB = normalizarDB(parsed);
    await salvar();
    aplicarAssinaturas();
    render();
    toast('✅ Backup importado! Considere exportar no novo formato criptografado.');
  } catch {
    toast('⚠ Arquivo inválido ou corrompido.');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DADOS — SCHEMA E NORMALIZAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

function _dadosDemostracao() {
  const m = now.getMonth(), a = now.getFullYear();
  return {
    despesas: [
      { id:1, desc:'Supermercado', valor:320,  cat:'Alimentação', tipo:'variavel', mes:m, ano:a, data:'', obs:'' },
      { id:2, desc:'Aluguel',      valor:1200, cat:'Moradia',     tipo:'fixa',    mes:m, ano:a, data:'', obs:'' },
      { id:3, desc:'Gasolina',     valor:180,  cat:'Transporte',  tipo:'variavel', mes:m, ano:a, data:'', obs:'' },
      { id:4, desc:'Academia',     valor:99,   cat:'Saúde',       tipo:'fixa',    mes:m, ano:a, data:'', obs:'' },
    ],
    receitas: [
      { id:5, desc:'Salário',   valor:5000, cat:'Salário',   mes:m, ano:a, data:'', obs:'' },
      { id:6, desc:'Freelance', valor:800,  cat:'Freelance', mes:m, ano:a, data:'', obs:'' },
    ],
    metas: [
      { id:7, desc:'Viagem Europa',      alvo:8000,  atual:2400, historico:[] },
      { id:8, desc:'Reserva emergência', alvo:15000, atual:7500, historico:[] },
    ],
    assinaturas: [
      { id:9,  desc:'Netflix',  valor:39.90, cat:'Lazer'   },
      { id:10, desc:'Spotify',  valor:21.90, cat:'Lazer'   },
      { id:11, desc:'Internet', valor:99.90, cat:'Moradia' },
    ],
    planejado: { Alimentação:800, Transporte:300, Saúde:200, Lazer:250, Moradia:1200, Educação:200, Investimento:500, Outros:150 },
    assinLancadas: [],
  };
}

/**
 * Normaliza e sanitiza um objeto de DB importado ou carregado.
 * Garante que todos os campos têm os tipos e ranges corretos.
 */
function normalizarDB(src) {
  const base = _dadosDemostracao();
  if (!src || typeof src !== 'object') return base;

  if (Array.isArray(src.despesas)) {
    base.despesas = src.despesas.map((d, idx) => ({
      id:    Number.isFinite(parseInt(d?.id, 10)) ? parseInt(d.id, 10) : (Date.now() + idx),
      desc:  normalizarTexto(d?.desc),
      valor: num(d?.valor, 0),
      cat:   normalizarTexto(d?.cat),
      tipo:  (d?.tipo === 'fixa' || d?.tipo === 'variavel') ? d.tipo : 'variavel',
      mes:   safeMes(d?.mes),
      ano:   safeAno(d?.ano),
      data:  normalizarTexto(d?.data),
      obs:   normalizarTexto(d?.obs),
      ...(d?.assinId != null ? { assinId: d.assinId } : {}),
    })).filter(x => x.desc.length > 0);
  }

  if (Array.isArray(src.receitas)) {
    base.receitas = src.receitas.map((r, idx) => ({
      id:    Number.isFinite(parseInt(r?.id, 10)) ? parseInt(r.id, 10) : (Date.now() + idx),
      desc:  normalizarTexto(r?.desc),
      valor: num(r?.valor, 0),
      cat:   normalizarTexto(r?.cat),
      mes:   safeMes(r?.mes),
      ano:   safeAno(r?.ano),
      data:  normalizarTexto(r?.data),
      obs:   normalizarTexto(r?.obs),
    })).filter(x => x.desc.length > 0);
  }

  if (Array.isArray(src.metas)) {
    base.metas = src.metas.map((m, idx) => ({
      id:       Number.isFinite(parseInt(m?.id, 10)) ? parseInt(m.id, 10) : (Date.now() + idx),
      desc:     normalizarTexto(m?.desc),
      alvo:     num(m?.alvo, 0),
      atual:    num(m?.atual, 0),
      historico: Array.isArray(m?.historico)
        ? m.historico.map(h => ({ val: num(h?.val, 0), data: normalizarTexto(h?.data) }))
        : [],
    })).filter(x => x.desc.length > 0);
  }

  if (Array.isArray(src.assinaturas)) {
    base.assinaturas = src.assinaturas.map((a, idx) => ({
      id:    Number.isFinite(parseInt(a?.id, 10)) ? parseInt(a.id, 10) : (Date.now() + idx),
      desc:  normalizarTexto(a?.desc),
      valor: num(a?.valor, 0),
      cat:   normalizarTexto(a?.cat || 'Outros'),
    })).filter(x => x.desc.length > 0);
  }

  if (src.planejado && typeof src.planejado === 'object') {
    base.planejado = { ...base.planejado };
    Object.keys(src.planejado).forEach(k => {
      base.planejado[k] = num(src.planejado[k], 0);
    });
  }

  base.assinLancadas = Array.isArray(src.assinLancadas)
    ? src.assinLancadas.map(x => normalizarTexto(x))
    : [];

  // Recalcula nextId para evitar colisões após importação.
  let maxId = 0;
  [...base.despesas, ...base.receitas, ...base.metas, ...base.assinaturas].forEach(it => {
    const id = parseInt(it?.id, 10);
    if (Number.isFinite(id)) maxId = Math.max(maxId, id);
  });
  nextId = maxId + 1;

  return base;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSINATURAS AUTOMÁTICAS
// ═══════════════════════════════════════════════════════════════════════════════

function aplicarAssinaturas() {
  const chave = `${now.getFullYear()}-${now.getMonth()}`;
  if (DB.assinLancadas.includes(chave)) return;

  let count = 0;
  DB.assinaturas.forEach(a => {
    const jaExiste = DB.despesas.some(
      d => d.assinId === a.id && d.mes === now.getMonth() && d.ano === now.getFullYear()
    );
    if (!jaExiste) {
      DB.despesas.push({
        id:      nextId++,
        desc:    a.desc,
        valor:   a.valor,
        cat:     a.cat || 'Outros',
        tipo:    'fixa',
        mes:     now.getMonth(),
        ano:     now.getFullYear(),
        data:    '',
        obs:     'Assinatura automática',
        assinId: a.id,
      });
      count++;
    }
  });

  DB.assinLancadas.push(chave);
  salvar(); // fire-and-forget intencional após login (não precisa bloquear o render)
  if (count > 0) toast(`🔄 ${count} assinatura(s) lançada(s) automaticamente`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CÁLCULOS FINANCEIROS
// ═══════════════════════════════════════════════════════════════════════════════

function despMes(m = curMes, a = curAno) { return DB.despesas.filter(d => d.mes === m && d.ano === a); }
function recMes(m = curMes, a = curAno)  { return DB.receitas.filter(r => r.mes === m && r.ano === a); }
function totD(m = curMes, a = curAno)    { return despMes(m, a).filter(d => d.cat !== 'Investimento').reduce((s, d) => s + d.valor, 0); }
function totR(m = curMes, a = curAno)    { return recMes(m, a).reduce((s, r) => s + r.valor, 0); }
function totI(m = curMes, a = curAno)    { return despMes(m, a).filter(d => d.cat === 'Investimento').reduce((s, d) => s + d.valor, 0); }
function salMes(m = curMes, a = curAno)  { return totR(m, a) - totD(m, a) - totI(m, a); }

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP DE SELETORES
// ═══════════════════════════════════════════════════════════════════════════════

function setupSels() {
  const sm = document.getElementById('sel-mes');
  const sa = document.getElementById('sel-ano');
  const df = document.getElementById('desp-cat-fil');

  sm.innerHTML = MESES.map((n, i) => `<option value="${i}"${i === curMes ? ' selected' : ''}>${n}</option>`).join('');

  const ay = now.getFullYear();
  sa.innerHTML = '';
  for (let a = ay - 3; a <= ay + 1; a++) {
    const o = document.createElement('option');
    o.value = a; o.textContent = a;
    if (a === curAno) o.selected = true;
    sa.appendChild(o);
  }

  df.innerHTML = '<option value="">Todas categorias</option>' +
    CATS_D.map(c => `<option value="${c}">${c}</option>`).join('');

  sm.onchange = () => { curMes = parseInt(sm.value); render(); };
  sa.onchange = () => { curAno = parseInt(sa.value); render(); };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

function render() {
  document.getElementById('mes-label').textContent = MESES[curMes] + ' de ' + curAno;

  const ent = totR(), sai = totD(), inv = totI(), sal = salMes();
  document.getElementById('m-ent').textContent = fmt(ent);
  document.getElementById('m-sai').textContent = fmt(sai);
  document.getElementById('m-inv').textContent = fmt(inv);

  const se = document.getElementById('m-sal');
  se.textContent = fmt(sal);
  se.style.color = sal >= 0 ? 'var(--green)' : 'var(--red)';

  document.getElementById('m-ent-sub').textContent = recMes().length + ' lançamento(s)';
  document.getElementById('m-sai-sub').textContent = despMes().length + ' lançamento(s)';

  try { rResumo();       } catch (e) { console.error('[render] rResumo:', e); }
  try { rDespesas();     } catch (e) { console.error('[render] rDespesas:', e); }
  try { rReceitas();     } catch (e) { console.error('[render] rReceitas:', e); }
  try { rMetas();        } catch (e) { console.error('[render] rMetas:', e); }
  try { rAssinaturas();  } catch (e) { console.error('[render] rAssinaturas:', e); }
  try { rPlanejamento(); } catch (e) { console.error('[render] rPlanejamento:', e); }
  try { rAnual();        } catch (e) { console.error('[render] rAnual:', e); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER POR SEÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

function rResumo() {
  const dm   = despMes();
  const cats = {};
  dm.forEach(d => { cats[d.cat] = (cats[d.cat] || 0) + d.valor; });

  const lb = Object.keys(cats);
  const vl = lb.map(l => cats[l]);
  const co = lb.map(l => CORES[l] || '#94a3b8');

  if (catCI) catCI.destroy();
  if (lb.length) {
    catCI = new Chart(document.getElementById('catChart'), {
      type: 'doughnut',
      data: { labels: lb, datasets: [{ data: vl, backgroundColor: co, borderWidth: 0, hoverOffset: 5 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + fmt(c.parsed) } } },
      },
    });
  }

  document.getElementById('cat-leg').innerHTML = lb
    .map((l, i) => `<span class="li"><span class="ld" style="background:${co[i]}"></span>${escHtml(l)} ${fmt(vl[i])}</span>`)
    .join('');

  const months = [];
  for (let i = 5; i >= 0; i--) {
    let m = curMes - i, a = curAno;
    if (m < 0) { m += 12; a--; }
    months.push({ m, a, lb: MESES[m].substring(0, 3) });
  }

  if (evolCI) evolCI.destroy();
  evolCI = new Chart(document.getElementById('evolChart'), {
    type: 'line',
    data: {
      labels: months.map(x => x.lb),
      datasets: [
        { label: 'Entradas', data: months.map(({ m, a }) => totR(m, a)), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.07)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#22c55e' },
        { label: 'Saídas',   data: months.map(({ m, a }) => totD(m, a)), borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.07)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#f87171' },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4e566e', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4e566e', font: { size: 11 }, callback: v => 'R$' + Math.round(v / 1000) + 'k' } },
      },
    },
  });

  const all  = [...dm, ...recMes()].slice(-8).reverse();
  const list = document.getElementById('res-list');
  if (!all.length) { list.innerHTML = '<div class="empty">Nenhum lançamento neste mês.</div>'; return; }

  list.innerHTML = all.map(item => {
    const isR = !!DB.receitas.find(r => r.id === item.id);
    return `<div class="ri">
      <div>
        <div>${escHtml(item.desc)}${item.data ? ` <span style="font-size:11px;color:var(--text3)">${escHtml(fmtD(item.data))}</span>` : ''}</div>
        <div class="ri-sub">${escHtml(item.cat || '')}</div>
      </div>
      <div class="ri-r">
        <span class="badge ${isR ? 'bg' : 'br'}">${isR ? 'Receita' : 'Despesa'}</span>
        <span style="font-family:'DM Mono',monospace;font-size:14px;color:${isR ? 'var(--green)' : 'var(--red)'}">${fmt(item.valor)}</span>
      </div>
    </div>`;
  }).join('');
}

function rDespesas() {
  let dm = despMes();
  const b  = (document.getElementById('desp-busca').value || '').toLowerCase();
  const cf = document.getElementById('desp-cat-fil').value;
  const tf = document.getElementById('desp-tipo-fil').value;

  if (b)  dm = dm.filter(d => d.desc.toLowerCase().includes(b));
  if (cf) dm = dm.filter(d => d.cat === cf);
  if (tf) dm = dm.filter(d => d.tipo === tf);

  dm.sort((a, b) => (b.data || '').localeCompare(a.data || '') || b.id - a.id);

  const list = document.getElementById('desp-list');
  const tot  = document.getElementById('desp-total');

  if (!dm.length) {
    list.innerHTML = '<div class="empty">Nenhuma despesa encontrada.</div>';
    tot.textContent = '';
    return;
  }

  list.innerHTML = dm.map(d => `<div class="ri">
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span>${escHtml(d.desc)}</span>
        ${d.data ? `<span style="font-size:11px;color:var(--text3)">${escHtml(fmtD(d.data))}</span>` : ''}
      </div>
      <div class="ri-sub">${d.tipo === 'fixa' ? 'Fixa' : 'Variável'} · ${escHtml(d.cat)}${d.obs ? ` · ${escHtml(d.obs)}` : ''}</div>
    </div>
    <div class="ri-r">
      <span class="badge br">${escHtml(d.cat)}</span>
      <span style="font-family:'DM Mono',monospace;font-size:14px;color:var(--red)">${fmt(d.valor)}</span>
      <button class="btn-ico" onclick="editarItem('despesas',${d.id})" title="Editar">✏</button>
      <button class="btn-del" onclick="del('despesas',${d.id})">×</button>
    </div>
  </div>`).join('');

  tot.textContent = `Total: ${fmt(dm.reduce((s, d) => s + d.valor, 0))} (${dm.length} itens)`;
}

function rReceitas() {
  let rm = recMes();
  const b = (document.getElementById('rec-busca').value || '').toLowerCase();
  if (b) rm = rm.filter(r => r.desc.toLowerCase().includes(b));
  rm.sort((a, b) => (b.data || '').localeCompare(a.data || '') || b.id - a.id);

  const list = document.getElementById('rec-list');
  const tot  = document.getElementById('rec-total');

  if (!rm.length) {
    list.innerHTML = '<div class="empty">Nenhuma receita encontrada.</div>';
    tot.textContent = '';
    return;
  }

  list.innerHTML = rm.map(r => `<div class="ri">
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span>${escHtml(r.desc)}</span>
        ${r.data ? `<span style="font-size:11px;color:var(--text3)">${escHtml(fmtD(r.data))}</span>` : ''}
      </div>
      <div class="ri-sub">${escHtml(r.cat)}${r.obs ? ` · ${escHtml(r.obs)}` : ''}</div>
    </div>
    <div class="ri-r">
      <span style="font-family:'DM Mono',monospace;font-size:14px;color:var(--green)">${fmt(r.valor)}</span>
      <button class="btn-ico" onclick="editarItem('receitas',${r.id})" title="Editar">✏</button>
      <button class="btn-del" onclick="del('receitas',${r.id})">×</button>
    </div>
  </div>`).join('');

  tot.textContent = `Total: ${fmt(rm.reduce((s, r) => s + r.valor, 0))} (${rm.length} itens)`;
}

function rMetas() {
  const list = document.getElementById('metas-list');
  if (!DB.metas.length) { list.innerHTML = '<div class="empty">Nenhuma meta cadastrada.</div>'; return; }

  list.innerHTML = DB.metas.map(m => {
    const pct   = pctFromParts(m.atual, m.alvo);
    const cor   = pct >= 100 ? 'var(--green)' : pct >= 60 ? 'var(--blue)' : 'var(--amber)';
    const falta = m.alvo - m.atual;
    const ult   = m.historico?.length
      ? `<div style="font-size:11px;color:var(--text3);margin-top:4px">Último depósito: ${fmt(m.historico[m.historico.length - 1].val)} em ${escHtml(m.historico[m.historico.length - 1].data)}</div>`
      : '';

    return `<div class="pw">
      <div class="pr">
        <span style="font-size:14px;font-weight:500">${escHtml(m.desc)}</span>
        <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
          <span style="font-size:12px;color:var(--text3)">${fmt(m.atual)} / ${fmt(m.alvo)}</span>
          <span style="font-family:'DM Mono',monospace;font-size:12px;color:${cor}">${pct}%</span>
          <button class="meta-dep-btn" onclick="abrirDep(${m.id})">+ Depósito</button>
          <button class="btn-ico" onclick="editarItem('metas',${m.id})">✏</button>
          <button class="btn-del" onclick="del('metas',${m.id})">×</button>
        </div>
      </div>
      <div class="pb" style="margin-bottom:5px"><div class="pf" style="width:${pct}%;background:${cor}"></div></div>
      ${pct < 100
        ? `<div style="font-size:12px;color:var(--text3)">Falta ${fmt(falta)} para atingir a meta</div>`
        : `<div style="font-size:12px;color:var(--green)">✅ Meta atingida!</div>`}
      ${ult}
    </div>`;
  }).join('<div style="border-top:1px solid var(--border);margin:12px 0"></div>');
}

function rAssinaturas() {
  const list = document.getElementById('assin-list');
  if (!DB.assinaturas.length) {
    list.innerHTML = '<div class="empty">Nenhuma assinatura cadastrada.</div>';
  } else {
    list.innerHTML = DB.assinaturas.map(a => `<div class="ri">
      <div>
        <div>${escHtml(a.desc)}</div>
        <div class="ri-sub">${escHtml(a.cat || 'Outros')}</div>
      </div>
      <div class="ri-r">
        <span class="badge bt">Mensal</span>
        <span style="font-family:'DM Mono',monospace;font-size:14px;color:var(--amber)">${fmt(a.valor)}</span>
        <button class="btn-ico" onclick="editarItem('assinaturas',${a.id})">✏</button>
        <button class="btn-del" onclick="del('assinaturas',${a.id})">×</button>
      </div>
    </div>`).join('');
  }
  document.getElementById('assin-total').textContent = fmt(DB.assinaturas.reduce((s, a) => s + a.valor, 0));
}

function rPlanejamento() {
  const dm   = despMes();
  const cats = {};
  dm.forEach(d => { cats[d.cat] = (cats[d.cat] || 0) + d.valor; });

  document.getElementById('plan-list').innerHTML = Object.keys(DB.planejado).map(cat => {
    const real = cats[cat] || 0;
    const plan = num(DB.planejado[cat], 0);
    const pct  = plan > 0 ? Math.min(100, Math.round((real / plan) * 100)) : (real > 0 ? 100 : 0);
    const over = plan > 0 ? real > plan : real > 0;
    return `<div class="pw">
      <div class="pr">
        <span>${escHtml(cat)}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:${over ? 'var(--red)' : 'var(--text3)'}">${fmt(real)} / ${fmt(plan)}</span>
          ${over ? '<span style="font-size:11px;color:var(--red)">⚠ Estourou</span>' : ''}
        </div>
      </div>
      <div class="pb"><div class="pf" style="width:${pct}%;background:${over ? 'var(--red)' : 'var(--blue)'}"></div></div>
    </div>`;
  }).join('');
}

function rAnual() {
  const eD  = Array.from({ length: 12 }, (_, i) => totR(i, curAno));
  const sD  = Array.from({ length: 12 }, (_, i) => totD(i, curAno));
  const slD = Array.from({ length: 12 }, (_, i) => salMes(i, curAno));
  const tE  = eD.reduce((s, v) => s + v, 0);
  const tS  = sD.reduce((s, v) => s + v, 0);
  const tSl = slD.reduce((s, v) => s + v, 0);

  document.getElementById('ano-ent').textContent = fmt(tE);
  document.getElementById('ano-sai').textContent = fmt(tS);
  const se = document.getElementById('ano-sal');
  se.textContent = fmt(tSl);
  se.style.color = tSl >= 0 ? 'var(--green)' : 'var(--red)';

  if (yearCI) yearCI.destroy();
  yearCI = new Chart(document.getElementById('yearChart'), {
    type: 'bar',
    data: {
      labels: MESES.map(m => m.substring(0, 3)),
      datasets: [
        { label: 'Entradas', data: eD,  backgroundColor: 'rgba(34,197,94,0.6)',   borderRadius: 4 },
        { label: 'Saídas',   data: sD,  backgroundColor: 'rgba(248,113,113,0.6)', borderRadius: 4 },
        { type: 'line', label: 'Saldo', data: slD, borderColor: '#fbbf24', backgroundColor: 'transparent', tension: 0.4, pointRadius: 4, pointBackgroundColor: '#fbbf24', yAxisID: 'y1' },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x:  { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4e566e', font: { size: 11 } } },
        y:  { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4e566e', font: { size: 11 }, callback: v => 'R$' + Math.round(v / 1000) + 'k' }, position: 'left' },
        y1: { position: 'right', grid: { display: false }, ticks: { color: '#fbbf24', font: { size: 10 }, callback: v => 'R$' + Math.round(v / 1000) + 'k' } },
      },
    },
  });

  document.getElementById('ano-tabela').innerHTML = MESES.map((mes, i) => {
    if (eD[i] === 0 && sD[i] === 0) return '';
    return `<div class="ri">
      <span style="font-size:14px;min-width:90px">${escHtml(mes)}</span>
      <div class="ri-r">
        <span style="font-size:13px;color:var(--green);min-width:100px;text-align:right">${fmt(eD[i])}</span>
        <span style="font-size:13px;color:var(--red);min-width:100px;text-align:right">${fmt(sD[i])}</span>
        <span style="font-family:'DM Mono',monospace;font-size:13px;min-width:110px;text-align:right;color:${slD[i] >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(slD[i])}</span>
      </div>
    </div>`;
  }).join('') || '<div class="empty">Nenhum dado neste ano.</div>';
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════════════════════════════════════════

function del(col, id) {
  if (!confirm('Remover este item?')) return;
  DB[col] = DB[col].filter(x => x.id !== id);
  salvar();
  render();
  toast('🗑 Item removido');
}

function editarItem(col, id) {
  const item = DB[col].find(x => x.id === id);
  if (!item) return;
  const map = { despesas: 'despesa', receitas: 'receita', metas: 'meta', assinaturas: 'assinatura' };
  editId = id;
  abrirModal(map[col], item);
}

function abrirDep(id) {
  depMetaId = id;
  const m = DB.metas.find(x => x.id === id);
  document.getElementById('dep-nome').textContent = m.desc;
  document.getElementById('dep-val').value = '';
  document.getElementById('mo-dep').classList.add('open');
  setTimeout(() => document.getElementById('dep-val').focus(), 120);
}

function fecharDep() { document.getElementById('mo-dep').classList.remove('open'); }

function salvarDep() {
  const val = parseFloat(document.getElementById('dep-val').value) || 0;
  if (!val) { toast('⚠ Informe o valor'); return; }
  const m = DB.metas.find(x => x.id === depMetaId);
  if (!m) return;
  m.atual += val;
  if (!m.historico) m.historico = [];
  m.historico.push({ val, data: new Date().toLocaleDateString('pt-BR') });
  fecharDep();
  salvar();
  rMetas();
  toast(`✅ ${fmt(val)} adicionado à meta "${m.desc}"`);
}

function abrirPlan() {
  document.getElementById('plan-inputs').innerHTML = Object.keys(DB.planejado)
    .map(cat => `<div class="fg">
      <label class="fl">${escHtml(cat)}</label>
      <input class="fi" id="pl-${cat.replace(/\s/g, '_')}" type="number" value="${DB.planejado[cat]}" step="50"/>
    </div>`)
    .join('');
  document.getElementById('mo-plan').classList.add('open');
}

function fecharPlan() { document.getElementById('mo-plan').classList.remove('open'); }

function salvarPlan() {
  Object.keys(DB.planejado).forEach(cat => {
    const el = document.getElementById('pl-' + cat.replace(/\s/g, '_'));
    if (el) DB.planejado[cat] = parseFloat(el.value) || 0;
  });
  fecharPlan();
  salvar();
  render();
  toast('✅ Metas de planejamento atualizadas!');
}

function abrirModal(mode, item = null) {
  modalMode = mode;
  editId    = item ? item.id : null;
  const isEdit = !!item;

  const titles = {
    despesa:    isEdit ? 'Editar despesa'    : 'Nova despesa',
    receita:    isEdit ? 'Editar receita'    : 'Nova receita',
    meta:       isEdit ? 'Editar meta'       : 'Nova meta',
    assinatura: isEdit ? 'Editar assinatura' : 'Nova assinatura',
  };

  document.getElementById('mo-title').textContent        = titles[mode];
  document.getElementById('mo-save').textContent         = isEdit ? 'Salvar alterações' : 'Salvar';
  document.getElementById('f-desc').value                = item?.desc  || '';
  document.getElementById('f-val').value                 = item?.valor || '';
  document.getElementById('f-obs').value                 = item?.obs   || '';
  document.getElementById('f-data').value                = item?.data  || '';
  document.getElementById('f-alvo').value                = item?.alvo  || '';
  document.getElementById('f-atual').value               = item?.atual || '';

  const catSel = document.getElementById('f-cat');
  let cats = mode === 'receita' ? CATS_R : CATS_D;
  if (mode === 'assinatura') cats = [...new Set([...CATS_D, ...CATS_R])];
  catSel.innerHTML = cats
    .map(c => `<option value="${c}"${item?.cat === c ? ' selected' : ''}>${c}</option>`)
    .join('');

  document.getElementById('f-tipo').value = item?.tipo || 'variavel';

  // Visibilidade de campos por modo
  const show = (id, cond) => { document.getElementById(id).style.display = cond ? 'block' : 'none'; };
  show('g-cat',   mode !== 'meta');
  show('g-tipo',  mode === 'despesa');
  show('g-data',  mode === 'despesa' || mode === 'receita');
  show('g-obs',   mode === 'despesa' || mode === 'receita');
  show('g-val',   mode !== 'meta');
  show('g-alvo',  mode === 'meta');
  show('g-atual', mode === 'meta');

  document.getElementById('mo').classList.add('open');
  setTimeout(() => document.getElementById('f-desc').focus(), 120);
}

function fecharModal() {
  document.getElementById('mo').classList.remove('open');
  editId = null;
}

function salvarModal() {
  const desc  = document.getElementById('f-desc').value.trim();
  const valor = parseFloat(document.getElementById('f-val').value) || 0;
  const cat   = document.getElementById('f-cat').value;
  const tipo  = document.getElementById('f-tipo').value;
  const data  = document.getElementById('f-data').value || '';
  const obs   = document.getElementById('f-obs').value.trim();

  if (!desc) { toast('⚠ Informe a descrição'); return; }

  if (editId) {
    // ── EDIÇÃO ──────────────────────────────────────────────────────────────
    if (modalMode === 'meta') {
      const alvo = parseFloat(document.getElementById('f-alvo').value) || 0;
      if (!alvo) { toast('⚠ Informe o valor alvo'); return; }
      const m = DB.metas.find(x => x.id === editId);
      if (m) { m.desc = desc; m.alvo = alvo; m.atual = parseFloat(document.getElementById('f-atual').value) || m.atual; }

    } else if (modalMode === 'assinatura') {
      if (!valor) { toast('⚠ Informe o valor'); return; }
      const a = DB.assinaturas.find(x => x.id === editId);
      if (a) { a.desc = desc; a.valor = valor; a.cat = cat; }

    } else if (modalMode === 'receita') {
      if (!valor) { toast('⚠ Informe o valor'); return; }
      const r = DB.receitas.find(x => x.id === editId);
      if (r) { r.desc = desc; r.valor = valor; r.cat = cat; r.data = data; r.obs = obs; }

    } else {
      if (!valor) { toast('⚠ Informe o valor'); return; }
      const d = DB.despesas.find(x => x.id === editId);
      if (d) { d.desc = desc; d.valor = valor; d.cat = cat; d.tipo = tipo; d.data = data; d.obs = obs; }
    }
    toast('✅ Alteração salva!');

  } else {
    // ── NOVO ────────────────────────────────────────────────────────────────
    if (modalMode === 'meta') {
      const alvo = parseFloat(document.getElementById('f-alvo').value) || 0;
      if (!alvo) { toast('⚠ Informe o valor alvo'); return; }
      DB.metas.push({ id: nextId++, desc, alvo, atual: parseFloat(document.getElementById('f-atual').value) || 0, historico: [] });

    } else if (modalMode === 'assinatura') {
      if (!valor) { toast('⚠ Informe o valor'); return; }
      DB.assinaturas.push({ id: nextId++, desc, valor, cat });

    } else if (modalMode === 'receita') {
      if (!valor) { toast('⚠ Informe o valor'); return; }
      DB.receitas.push({ id: nextId++, desc, valor, cat, mes: curMes, ano: curAno, data, obs });

    } else {
      if (!valor) { toast('⚠ Informe o valor'); return; }
      DB.despesas.push({ id: nextId++, desc, valor, cat, tipo, mes: curMes, ano: curAno, data, obs });
    }
    toast('✅ Lançamento salvo!');
  }

  fecharModal();
  salvar();
  render();
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVEGAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

function goTab(name, el) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');

  const titles = {
    resumo: 'Resumo do Mês', despesas: 'Despesas', receitas: 'Receitas',
    metas: 'Metas Financeiras', assinaturas: 'Assinaturas',
    planejamento: 'Planejamento', anual: 'Visão Anual',
  };
  document.getElementById('page-title').textContent = titles[name] || name;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTOS E INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

// Fechar modais ao clicar no overlay ou pressionar Escape
['mo', 'mo-plan', 'mo-dep', 'mo-senha'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => {
    if (e.target === e.currentTarget) document.getElementById(id).classList.remove('open');
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['mo', 'mo-plan', 'mo-dep', 'mo-senha'].forEach(id => {
      document.getElementById(id).classList.remove('open');
    });
  }
});

setupSels();
setTimeout(() => document.getElementById('lock-inp').focus(), 300);
