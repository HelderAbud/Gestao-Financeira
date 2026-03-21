"use client";

import type { components } from "@hh/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatBrl } from "@/lib/format";
import { apiFetch, getToken } from "@/lib/api";

type Row = components["schemas"]["SubscriptionResponse"];
type Body = components["schemas"]["SubscriptionCreateRequest"];

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<Row | "new" | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);

  const list = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => apiFetch<Row[]>("/api/v1/subscriptions"),
    enabled: !!getToken(),
  });

  useEffect(() => {
    if (modal === "new") {
      setDescription("");
      setAmount("");
      setCategory(EXPENSE_CATEGORIES[0]);
    } else if (modal && typeof modal === "object") {
      setDescription(modal.description ?? "");
      setAmount(String(modal.amount ?? ""));
      setCategory(modal.category ?? EXPENSE_CATEGORIES[0]);
    }
  }, [modal]);

  const saveMut = useMutation({
    mutationFn: async (payload: { id?: number; body: Body }) => {
      const { id, body } = payload;
      if (id != null) {
        return apiFetch<Row>(`/api/v1/subscriptions/${id}`, {
          method: "PUT",
          json: body,
        });
      }
      return apiFetch<Row>("/api/v1/subscriptions", {
        method: "POST",
        json: body,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setModal(null);
    },
  });

  const delMut = useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/v1/subscriptions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  function buildBody(): Body {
    return {
      description: description.trim(),
      amount: Number(amount),
      category,
    };
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
          <h1 className="text-lg font-semibold text-white">Assinaturas</h1>
          <p className="text-sm text-hh-muted">
            Despesas recorrentes (ex.: streaming). Use em Despesas para vincular.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal("new")}
          className="rounded-lg bg-hh-gold px-4 py-2 text-sm font-medium text-hh-bg hover:opacity-90"
        >
          Nova assinatura
        </button>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-hh-muted">
            <tr>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-hh-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {list.isError && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-red-400">
                  {(list.error as Error).message}
                </td>
              </tr>
            )}
            {list.data?.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-800/80 hover:bg-slate-900/40"
              >
                <td className="px-4 py-3 text-white">{row.description}</td>
                <td className="px-4 py-3">{row.category}</td>
                <td className="px-4 py-3 text-right font-mono text-sky-300">
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
                      if (
                        row.id != null &&
                        window.confirm("Excluir esta assinatura?")
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
                <td colSpan={4} className="px-4 py-8 text-center text-hh-muted">
                  Nenhuma assinatura cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal != null}
        title={modal === "new" ? "Nova assinatura" : "Editar assinatura"}
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
            <span className="text-hh-muted">Valor mensal (R$)</span>
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
