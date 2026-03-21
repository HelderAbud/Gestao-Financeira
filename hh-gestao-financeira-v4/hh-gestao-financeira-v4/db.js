
// db.js - banco IndexedDB
const DB_NAME = "hh_finance_v4";
const STORE = "dados";

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            db.createObjectStore(STORE);
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = () => reject(req.error || new Error("Falha ao abrir IndexedDB"));
    });
}

async function saveDB(data) {
    const db = await openDB();
    await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(data, "finance");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error("Falha ao salvar dados"));
        tx.onabort = () => reject(tx.error || new Error("Transação abortada ao salvar"));
    });
}

async function loadDB() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get("finance");
        req.onsuccess = () => resolve(req.result || {});
        req.onerror = () => reject(req.error || new Error("Falha ao carregar dados"));
    });
}
