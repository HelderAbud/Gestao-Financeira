"use client";

import type { components } from "@hh/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { PeriodFilter } from "@/components/PeriodFilter";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatBrl } from "@/lib/format";
import { apiFetch, getToken } from "@/lib/api";

type Row = components["schemas"]["BudgetResponse"];
type Body = components["schemas"]["BudgetUpsertRequest"];

export default function BudgetsPage() {
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [modal, setModal] = useState<Row | "new" | null>(null);
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [plannedAmount, setPlannedAmount] = useState("");

  const list = useQuery({
    queryKey: ["budgets", year, month],
    queryFn: () =>
      apiFetch<Row[]>(`/api/v1/budgets?year=${year}&month=${month}`),
    enabled: !!getToken(),
  });

  useEffect(() => {
    if (modal === "new") {
      setCategory(EXPENSE_CATEGORIES[0]);
      setPlannedAmount("");
    } else if (modal && typeof modal === "object") {
      setCategory(modal.category ?? EXPENSE_CATEGORIES[0]);
      setPlannedAmount(String(modal.plannedAmount ?? ""));
    }
  }, [modal]);

  const saveMut = useMutation({
    mutationFn: (body: Body) =>
      apiFetch<Row>("/api/v1/budgets", { method: "POST", json: body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      setModal(null);
    },
  });

  const delMut = useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/v1/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body: Body = {
      year,
      month,
      category,
      plannedAmount: Number(plannedAmount),
    };
    saveMut.mutate(body);
  }

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Orçamentos</h1>
          <p className="text-sm text-hh-muted">
            Planejamento por categoria no mês (upsert por categoria).
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <PeriodFilter
            year={year}
            month={month}
            onYear={setYear}
            onMonth={setMonth}
          />
          <button
            type="button"
            onClick={() => setModal("new")}
            className="rounded-lg bg-hh-gold px-4 py-2 text-sm font-medium text-hh-bg hover:opacity-90"
          >
            Novo orçamento
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-hh-muted">
            <tr>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Planejado</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-hh-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {list.isError && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-red-400">
                  {(list.error as Error).message}
                </td>
              </tr>
            )}
            {list.data?.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-800/80 hover:bg-slate-900/40"
              >
                <td className="px-4 py-3 text-white">{row.category}</td>
                <td className="px-4 py-3 text-right font-mono text-amber-200">
                  {formatBrl(row.plannedAmount)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="mr-2 text-hh-gold hover:underline"
                    onClick={() => setModal(row)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-red-400 hover:underline"
                    onClick={() => {
                      if (
                        row.id != null &&
                        window.confirm("Excluir este orçamento?")
                      ) {
                        delMut.mutate(row.id);
                      }
                    }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {list.data?.length === 0 && !list.isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-hh-muted">
                  Nenhum orçamento neste mês.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal != null}
        title={modal === "new" ? "Novo orçamento" : "Editar orçamento"}
        onClose={() => setModal(null)}
      >
        <form onSubmit={submit} className="flex flex-col gap-3">
          <p className="text-xs text-hh-muted">
            Período: {String(month).padStart(2, "0")}/{year}
          </p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-hh-muted">Categoria</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-hh-muted">Valor planejado (R$)</span>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={plannedAmount}
              onChange={(e) => setPlannedAmount(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
          {saveMut.isError && (
            <p className="text-sm text-red-400">
              {(saveMut.error as Error).message}
            </p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-lg px-4 py-2 text-sm text-hh-muted hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="rounded-lg bg-hh-gold px-4 py-2 text-sm font-medium text-hh-bg disabled:opacity-50"
            >
              {saveMut.isPending ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
