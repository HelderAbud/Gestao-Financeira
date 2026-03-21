
// security.js - criptografia AES-GCM com PBKDF2 + sal aleatório por instalação
const KDF_SALT_KEY = "hh_v4_kdf_salt_b64";

function bytesToB64(bytes) {
    let s = "";
    bytes.forEach(b => { s += String.fromCharCode(b); });
    return btoa(s);
}

function b64ToBytes(b64) {
    const s = atob(b64);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
}

function getOrCreateSalt() {
    const existing = localStorage.getItem(KDF_SALT_KEY);
    if (existing) return b64ToBytes(existing);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(KDF_SALT_KEY, bytesToB64(salt));
    return salt;
}

async function generateKey(password) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: getOrCreateSalt(),
            iterations: 120000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encryptData(password, data) {
    const key = await generateKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(JSON.stringify(data))
    );
    return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
}

async function decryptData(password, payload) {
    const key = await generateKey(password);
    const iv = new Uint8Array(payload.iv);
    const data = new Uint8Array(payload.data);
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        data
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
}
