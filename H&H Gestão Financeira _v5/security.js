// security.js — v5
// Criptografia AES-GCM 256-bit com PBKDF2-SHA256.
// Melhorias v5:
//   • PBKDF2 elevado de 120.000 → 600.000 iterações (recomendação OWASP 2023)
//   • exportarCriptografado() / importarCriptografado() para backup seguro
//   • Salt de instalação de 32 bytes (era 16)

const KDF_SALT_KEY = 'hh_v5_kdf_salt';
const PBKDF2_ITERATIONS = 600_000;
const BACKUP_MAGIC = 'HHv5ENC'; // marcador no cabeçalho do arquivo exportado

// ── Utilidades de bytes ───────────────────────────────────────────────────────

function bytesToB64(bytes) {
  let s = '';
  bytes.forEach(b => { s += String.fromCharCode(b); });
  return btoa(s);
}

function b64ToBytes(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

// ── Salt de instalação (32 bytes) ─────────────────────────────────────────────

function getOrCreateSalt() {
  const existing = localStorage.getItem(KDF_SALT_KEY);
  if (existing) {
    try { return b64ToBytes(existing); } catch { /* recria se corrompido */ }
  }
  const salt = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(KDF_SALT_KEY, bytesToB64(salt));
  return salt;
}

// ── Derivação de chave ────────────────────────────────────────────────────────

async function generateKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Criptografia para IndexedDB (usa salt de instalação) ──────────────────────

async function encryptData(password, data) {
  const salt = getOrCreateSalt();
  const key  = await generateKey(password, salt);
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(data))
  );
  return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
}

async function decryptData(password, payload) {
  const salt = getOrCreateSalt();
  const key  = await generateKey(password, salt);
  const iv   = new Uint8Array(payload.iv);
  const data = new Uint8Array(payload.data);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

// ── Backup criptografado (salt próprio embutido no arquivo) ───────────────────
// Formato: JSON { magic, salt_b64, iv_b64, data_b64 }
// O salt é gerado na hora da exportação e gravado junto, para que o backup
// possa ser importado em qualquer dispositivo sem depender do salt de instalação.

async function exportarCriptografado(password, dados) {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const key  = await generateKey(password, salt);
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(dados))
  );
  return JSON.stringify({
    magic:    BACKUP_MAGIC,
    salt_b64: bytesToB64(salt),
    iv_b64:   bytesToB64(iv),
    data_b64: bytesToB64(new Uint8Array(encrypted)),
  });
}

async function importarCriptografado(password, texto) {
  let obj;
  try { obj = JSON.parse(texto); } catch {
    throw new Error('Arquivo de backup inválido (JSON malformado).');
  }
  if (obj.magic !== BACKUP_MAGIC) {
    throw new Error('Este arquivo não é um backup criptografado do H&H v5.');
  }
  const salt = b64ToBytes(obj.salt_b64);
  const iv   = b64ToBytes(obj.iv_b64);
  const data = b64ToBytes(obj.data_b64);
  const key  = await generateKey(password, salt);
  let decrypted;
  try {
    decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  } catch {
    throw new Error('Senha incorreta ou arquivo corrompido.');
  }
  return JSON.parse(new TextDecoder().decode(decrypted));
}
