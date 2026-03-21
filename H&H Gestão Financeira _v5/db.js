// db.js — v5
// Persistência IndexedDB com tratamento de erro explícito.
// Melhorias v5:
//   • Erros propagados corretamente (sem swallow silencioso)
//   • openDB reutiliza conexão aberta (evita abrir/fechar a cada salvar)
//   • Comentários descritivos por bloco

const DB_NAME  = 'hh_finance_v5';
const DB_STORE = 'dados';
const DB_VER   = 1;

// Cache da conexão aberta para reutilização entre chamadas.
let _dbConn = null;

function openDB() {
  if (_dbConn) return Promise.resolve(_dbConn);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);

    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };

    req.onsuccess = e => {
      _dbConn = e.target.result;

      // Se a conexão for encerrada externamente, limpa o cache.
      _dbConn.onclose = () => { _dbConn = null; };
      _dbConn.onversionchange = () => { _dbConn.close(); _dbConn = null; };

      resolve(_dbConn);
    };

    req.onerror = () => {
      reject(new Error('IndexedDB: falha ao abrir banco — ' + (req.error?.message || 'erro desconhecido')));
    };

    req.onblocked = () => {
      reject(new Error('IndexedDB: abertura bloqueada por outra aba. Feche outras abas e tente novamente.'));
    };
  });
}

// Persiste o payload criptografado { enc: {...} } no store.
// Retorna Promise<void>; rejeita com Error em caso de falha real.
async function saveDB(payload) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(DB_STORE, 'readwrite');
    const req = tx.objectStore(DB_STORE).put(payload, 'finance');

    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(new Error('IndexedDB: falha ao salvar — ' + (tx.error?.message || 'erro na transação')));
    tx.onabort    = () => reject(new Error('IndexedDB: transação abortada ao salvar.'));

    // onerror no request individual para capturar erros de quota.
    req.onerror = () => reject(new Error('IndexedDB: falha ao gravar registro — ' + (req.error?.message || 'erro desconhecido')));
  });
}

// Carrega e retorna o payload salvo, ou {} se ainda não houver dados.
async function loadDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get('finance');

    req.onsuccess = () => resolve(req.result || {});
    req.onerror   = () => reject(new Error('IndexedDB: falha ao carregar dados — ' + (req.error?.message || 'erro desconhecido')));
  });
}
