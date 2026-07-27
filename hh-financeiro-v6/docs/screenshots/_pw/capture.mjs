import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = process.env.HH_OUT || "/out";
const BASE = process.env.HH_WEB_URL || "http://host.docker.internal:3000";
const API = process.env.HH_API_URL || "http://host.docker.internal:8090";
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
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const day = String(now.getDate()).padStart(2, "0");
const entryDate = `${year}-${String(month).padStart(2, "0")}-${day}`;

const reg = await apiJson("/api/v1/auth/register", {
  method: "POST",
  body: { email, password },
});
const token = reg.accessToken;
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
console.log("seed ok", email);
const summaryCheck = await apiJson(
  `/api/v1/reports/monthly-summary?year=${year}&month=${month}`,
  { token }
);
console.log("summaryCheck", JSON.stringify(summaryCheck));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("console", (msg) => console.log("browser:", msg.type(), msg.text()));
page.on("requestfailed", (req) =>
  console.log("requestfailed", req.url(), req.failure()?.errorText)
);

// O build da web aponta API para localhost:8090 — no container isso não é a API.
// Proxy: browser -> Node (host.docker.internal:8090).
await page.route("**/*", async (route) => {
  const req = route.request();
  const raw = req.url();
  if (!/https?:\/\/(localhost|127\.0\.0\.1):8090\//.test(raw)) {
    await route.continue();
    return;
  }
  const url = raw.replace(/https?:\/\/(localhost|127\.0\.0\.1):8090/, API);
  console.log("proxy", req.method(), url);
  try {
    const headers = { ...req.headers() };
    delete headers["host"];
    // Spring CORS só aceita localhost:3000 no compose; a página abre via host.docker.internal.
    headers["origin"] = "http://localhost:3000";
    headers["referer"] = "http://localhost:3000/";

    if (req.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "http://host.docker.internal:3000",
          "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
          "access-control-allow-headers":
            headers["access-control-request-headers"] ||
            "authorization,content-type",
          "access-control-allow-credentials": "true",
          "vary": "Origin",
        },
        body: "",
      });
      return;
    }

    const res = await fetch(url, {
      method: req.method(),
      headers,
      body: req.postData(),
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const resHeaders = {};
    res.headers.forEach((v, k) => {
      const key = k.toLowerCase();
      if (key === "transfer-encoding") return;
      if (key.startsWith("access-control-")) return;
      resHeaders[k] = v;
    });
    resHeaders["access-control-allow-origin"] =
      "http://host.docker.internal:3000";
    resHeaders["access-control-allow-credentials"] = "true";
    resHeaders["vary"] = "Origin";
    console.log("proxy status", res.status, url);
    await route.fulfill({ status: res.status, headers: resHeaders, body: buf });
  } catch (err) {
    console.log("proxy error", err);
    await route.abort();
  }
});

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.screenshot({ path: join(OUT, "landing.png"), fullPage: true });
console.log("landing ok");

await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.evaluate((t) => localStorage.setItem("hh_access_token", t), token);
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForSelector("text=Resumo do mês", { timeout: 20000 });
try {
  await page.waitForFunction(
    () => {
      const body = document.body?.innerText || "";
      return body.includes("R$") || /\d+[,.]\d{2}/.test(body);
    },
    { timeout: 25000 }
  );
} catch (err) {
  console.log("wait values failed; body=\n", await page.innerText("body"));
  throw err;
}
await page.waitForTimeout(800);
await page.screenshot({ path: join(OUT, "dashboard.png"), fullPage: true });
console.log("dashboard ok");
await browser.close();
writeFileSync(
  join(OUT, "_capture-dia2.last.json"),
  JSON.stringify({ email, at: new Date().toISOString() }, null, 2)
);
console.log("done");
