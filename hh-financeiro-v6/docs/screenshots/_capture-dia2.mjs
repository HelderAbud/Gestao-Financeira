/**
 * Dia 2 — captura landing + dashboard (uso local, não importar na app).
 * Uso: node docs/screenshots/_capture-dia2.mjs
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = process.env.HH_WEB_URL || "http://127.0.0.1:3000";
const API = process.env.HH_API_URL || "http://127.0.0.1:8090";
const email = `demo.dia2.${Date.now()}@example.com`;
const password = "demo-pass-12345";

async function apiJson(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function seed(token) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = String(now.getDate()).padStart(2, "0");
  const entryDate = `${year}-${String(month).padStart(2, "0")}-${day}`;

  await apiJson("/api/v1/incomes", {
    method: "POST",
    token,
    body: {
      description: "Salário demo",
      amount: 5500,
      category: "Trabalho",
      month,
      year,
      entryDate,
      notes: "Dados fictícios Dia 2",
    },
  });

  await apiJson("/api/v1/expenses", {
    method: "POST",
    token,
    body: {
      description: "Mercado demo",
      amount: 420.5,
      category: "Alimentação",
      expenseType: "VARIABLE",
      month,
      year,
      entryDate,
      notes: "Dados fictícios Dia 2",
    },
  });
}

mkdirSync(OUT, { recursive: true });

const reg = await apiJson("/api/v1/auth/register", {
  method: "POST",
  body: { email, password },
});
const token = reg.accessToken;
if (!token) throw new Error("register sem accessToken");
await seed(token);
console.log("seed ok:", email);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
});

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const landingPath = join(OUT, "landing.png");
await page.screenshot({ path: landingPath, fullPage: true });
console.log("wrote", landingPath);

await page.goto(BASE + "/login", { waitUntil: "networkidle" });
await page.evaluate((t) => localStorage.setItem("hh_access_token", t), token);
await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
await page.waitForSelector("text=Resumo do mês", { timeout: 15000 });
await page.waitForTimeout(1500);
const dashPath = join(OUT, "dashboard.png");
await page.screenshot({ path: dashPath, fullPage: true });
console.log("wrote", dashPath);

await browser.close();
writeFileSync(
  join(OUT, "_capture-dia2.last.json"),
  JSON.stringify({ email, landingPath, dashPath, at: new Date().toISOString() }, null, 2)
);
console.log("done");
