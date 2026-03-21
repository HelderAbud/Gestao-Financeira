"use client";

import type { components } from "@hh/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { PeriodFilter } from "@/components/PeriodFilter";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatBrl } from "@/lib/format";
import { apiFetch, getToken } from "@/lib/api";

type ExpenseRow = components["schemas"]["ExpenseResponse"];
type ExpenseBody = components["schemas"]["ExpenseCreateRequest"];
type SubscriptionRow = components["schemas"]["SubscriptionResponse"];

function todayISODate() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function ExpensesPage() {
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [modal, setModal] = useState<ExpenseRow | "new" | null>(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [expenseType, setExpenseType] = useState<"FIXED" | "VARIABLE">("VARIABLE");
  const [entryDate, setEntryDate] = useState(todayISODate());
  const [notes, setNotes] = useState("");
  const [subscriptionId, setSubscriptionId] = useState<string>("");

  const list = useQuery({
    queryKey: ["expenses", year, month],
    queryFn: () =>
      apiFetch<ExpenseRow[]>(`/api/v1/expenses?year=${year}&month=${month}`),
    enabled: !!getToken(),
  });

  const subs = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => apiFetch<SubscriptionRow[]>("/api/v1/subscriptions"),
    enabled: !!getToken(),
  });

  useEffect(() => {
    if (modal === "new") {
      setDescription("");
      setAmount("");
      setCategory(EXPENSE_CATEGORIES[0]);
      setExpenseType("VARIABLE");
      setEntryDate(todayISODate());
      setNotes("");
      setSubscriptionId("");
    } else if (modal && typeof modal === "object") {
      setDescription(modal.description ?? "");
      setAmount(String(modal.amount ?? ""));
      setCategory(modal.category ?? EXPENSE_CATEGORIES[0]);
      setExpenseType(modal.expenseType ?? "VARIABLE");
      setEntryDate(modal.entryDate ?? todayISODate());
      setNotes(modal.notes ?? "");
      setSubscriptionId(
        modal.subscriptionId != null ? String(modal.subscriptionId) : ""
      );
    }
  }, [modal]);

  const saveMut = useMutation({
    mutationFn: async (payload: { id?: number; body: ExpenseBody }) => {
      const { id, body } = payload;
      if (id != null) {
        return apiFetch<ExpenseRow>(`/api/v1/expenses/${id}`, {
          method: "PUT",
          json: body,
        });
      }
      return apiFetch<ExpenseRow>("/api/v1/expenses", {
        method: "POST",
        json: body,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      setModal(null);
    },
  });

  const delMut = useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/v1/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });

  function buildBody(): ExpenseBody {
    const body: ExpenseBody = {
      description: description.trim(),
      amount: Number(amount),
      category,
      expenseType,
      month,
      year,
      entryDate,
    };
    if (notes.trim()) body.notes = notes.trim();
    if (subscriptionId) body.subscriptionId = Number(subscriptionId);
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
          <h1 className="text-lg font-semibold text-white">Despesas</h1>
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
            Nova despesa
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-hh-muted">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-hh-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {list.isError && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-red-400">
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
                <td className="px-4 py-3 text-hh-muted">
                  {row.expenseType === "FIXED" ? "Fixa" : "Variável"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-rose-300">
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
                <td colSpan={6} className="px-4 py-8 text-center text-hh-muted">
                  Nenhuma despesa neste período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal != null}
        title={modal === "new" ? "Nova despesa" : "Editar despesa"}
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
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-hh-muted">Tipo</span>
            <select
              value={expenseType}
              onChange={(e) =>
                setExpenseType(e.target.value as "FIXED" | "VARIABLE")
              }
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            >
              <option value="VARIABLE">Variável</option>
              <option value="FIXED">Fixa</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-hh-muted">Mês (lançamento)</span>
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
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-hh-muted">Assinatura (opcional)</span>
            <select
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            >
              <option value="">—</option>
              {subs.data?.map((s) => (
                <option key={s.id} value={s.id ?? ""}>
                  {s.description}
                </option>
              ))}
            </select>
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
