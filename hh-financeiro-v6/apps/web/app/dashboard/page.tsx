"use client";

import type { components } from "@hh/types";
import { useQuery } from "@tanstack/react-query";
import { formatBrl } from "@/lib/format";
import { apiFetch, getToken } from "@/lib/api";

type Summary = components["schemas"]["MonthlySummaryResponse"];
type Insight = components["schemas"]["MonthlyInsightResponse"];

export default function DashboardPage() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  const summary = useQuery({
    queryKey: ["summary", y, m],
    queryFn: () =>
      apiFetch<Summary>(`/api/v1/reports/monthly-summary?year=${y}&month=${m}`),
    enabled: !!getToken(),
  });

  const insight = useQuery({
    queryKey: ["insight", y, m],
    queryFn: () =>
      apiFetch<Insight>(
        `/api/v1/insights/monthly-analysis?year=${y}&month=${m}`
      ),
    enabled: !!getToken(),
  });

  return (
    <main>
      <h1 className="text-lg font-semibold text-white">Resumo do mês</h1>
      <p className="mt-1 text-sm text-hh-muted">
        {m.toString().padStart(2, "0")}/{y}
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-hh-muted">Receitas</p>
          <p className="mt-1 text-2xl font-mono text-emerald-400">
            {formatBrl(summary.data?.totalIncome)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-hh-muted">Saídas (sem invest.)</p>
          <p className="mt-1 text-2xl font-mono text-rose-400">
            {formatBrl(summary.data?.totalExpenseOutflows)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-hh-muted">Investimento</p>
          <p className="mt-1 text-2xl font-mono text-sky-400">
            {formatBrl(summary.data?.totalInvestments)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-hh-muted">Saldo</p>
          <p className="mt-1 text-2xl font-mono text-hh-gold">
            {formatBrl(summary.data?.balance)}
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-base font-semibold text-white">Análise do mês</h2>
        <p className="mt-1 text-xs text-hh-muted">
          Texto gerado a partir dos seus dados. Com{" "}
          <code className="rounded bg-slate-800 px-1">OPENAI_API_KEY</code> na
          API, usa modelo de linguagem; caso contrário, resumo automático.
        </p>
        {insight.isLoading && (
          <p className="mt-4 text-sm text-hh-muted">A carregar análise…</p>
        )}
        {insight.isError && (
          <p className="mt-4 text-sm text-red-400">
            {(insight.error as Error).message}
          </p>
        )}
        {insight.data && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase text-hh-muted">
              {insight.data.mode === "OPENAI" ? "IA (OpenAI)" : "Resumo automático"}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
              {insight.data.text}
            </p>
          </div>
        )}
      </section>

      {summary.isError && (
        <p className="mt-6 text-sm text-red-400">
          Erro ao carregar resumo: {(summary.error as Error).message}
        </p>
      )}
    </main>
  );
}
