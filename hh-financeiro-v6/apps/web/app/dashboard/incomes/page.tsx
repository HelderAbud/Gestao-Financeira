"use client";

import type { components } from "@hh/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { PeriodFilter } from "@/components/PeriodFilter";
import { usePeriod } from "@/hooks/usePeriod";
import { INCOME_CATEGORIES } from "@/lib/categories";
import { formatBrl } from "@/lib/format";
import { apiFetch, getToken } from "@/lib/api";

type IncomeRow = components["schemas"]["IncomeResponse"];
type IncomeBody = components["schemas"]["IncomeCreateRequest"];

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export default function IncomesPage() {
  const qc = useQueryClient();
  const { year, month, setYear, setMonth } = usePeriod();
  const [modal, setModal] = useState<IncomeRow | "new" | null>(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [entryDate, setEntryDate] = useState(todayISODate());
  const [notes, setNotes] = useState("");

  const list = useQuery({
    queryKey: ["incomes", year, month],
    queryFn: () =>
      apiFetch<IncomeRow[]>(`/api/v1/incomes?year=${year}&month=${month}`),
    enabled: !!getToken(),
  });

  useEffect(() => {
    if (modal === "new") {
      setDescription("");
      setAmount("");
      setCategory(INCOME_CATEGORIES[0]);
      setEntryDate(todayISODate());
      setNotes("");
    } else if (modal && typeof modal === "object") {
      setDescription(modal.description ?? "");
      setAmount(String(modal.amount ?? ""));
      setCategory(modal.category ?? INCOME_CATEGORIES[0]);
      setEntryDate(modal.entryDate ?? todayISODate());
      setNotes(modal.notes ?? "");
    }
  }, [modal]);

  const saveMut = useMutation({
    mutationFn: async (payload: { id?: number; body: IncomeBody }) => {
      const { id, body } = payload;
      if (id != null) {
        return apiFetch<IncomeRow>(`/api/v1/incomes/${id}`, {
          method: "PUT",
          json: body,
        });
      }
      return apiFetch<IncomeRow>("/api/v1/incomes", {
        method: "POST",
        json: body,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incomes"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      setModal(null);
    },
  });

  const delMut = useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/v1/incomes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incomes"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });

  function buildBody(): IncomeBody {
    const body: IncomeBody = {
      description: description.trim(),
      amount: Number(amount),
      category,
      month,
      year,
      entryDate,
    };
    if (notes.trim()) body.notes = notes.trim();
    return body;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = buildBody();
    if (modal === "new") saveMut.mutate({ body });
    else if (modal && typeof modal === "object" && modal.id != null) {
      saveMut.mutate({ id: modal.id, body });
    }
  }

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Receitas</h1>
          <p className="text-sm text-hh-muted">Filtrar por período</p>
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
            Nova receita
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-hh-muted">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-hh-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {list.isError && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-red-400">
                  {(list.error as Error).message}
                </td>
              </tr>
            )}
            {list.data?.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-800/80 hover:bg-slate-900/40"
              >
                <td className="px-4 py-3 font-mono text-hh-muted">
                  {row.entryDate}
                </td>
                <td className="px-4 py-3 text-white">{row.description}</td>
                <td className="px-4 py-3">{row.category}</td>
                <td className="px-4 py-3 text-right font-mono text-emerald-300">
                  {formatBrl(row.amount)}
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
                      if (row.id != null && window.confirm("Excluir este lançamento?")) {
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
                <td colSpan={5} className="px-4 py-8 text-center text-hh-muted">
                  Nenhuma receita neste período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal != null}
        title={modal === "new" ? "Nova receita" : "Editar receita"}
        onClose={() => setModal(null)}
      >
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-hh-muted">Descrição</span>
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-hh-muted">Valor (R$)</span>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-hh-muted">Categoria</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            >
              {INCOME_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-hh-muted">Mês</span>
              <input
                required
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-hh-muted">Ano</span>
              <input
                required
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-hh-muted">Data</span>
            <input
              required
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-hh-muted">Observações</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
