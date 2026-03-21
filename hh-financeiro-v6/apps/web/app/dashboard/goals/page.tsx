"use client";

import type { components } from "@hh/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { formatBrl } from "@/lib/format";
import { apiFetch, getToken } from "@/lib/api";

type GoalRow = components["schemas"]["GoalResponse"];
type GoalBody = components["schemas"]["GoalCreateRequest"];
type DepositBody = components["schemas"]["GoalDepositRequest"];

export default function GoalsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<GoalRow | "new" | null>(null);
  const [depositFor, setDepositFor] = useState<GoalRow | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const list = useQuery({
    queryKey: ["goals"],
    queryFn: () => apiFetch<GoalRow[]>("/api/v1/goals"),
    enabled: !!getToken(),
  });

  useEffect(() => {
    if (modal === "new") {
      setDescription("");
      setTargetAmount("");
    } else if (modal && typeof modal === "object") {
      setDescription(modal.description ?? "");
      setTargetAmount(String(modal.targetAmount ?? ""));
    }
  }, [modal]);

  const saveMut = useMutation({
    mutationFn: async (payload: { id?: number; body: GoalBody }) => {
      const { id, body } = payload;
      if (id != null) {
        return apiFetch<GoalRow>(`/api/v1/goals/${id}`, {
          method: "PUT",
          json: body,
        });
      }
      return apiFetch<GoalRow>("/api/v1/goals", {
        method: "POST",
        json: body,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      setModal(null);
    },
  });

  const depositMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: DepositBody;
    }) =>
      apiFetch<unknown>(`/api/v1/goals/${id}/deposits`, {
        method: "POST",
        json: body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      setDepositFor(null);
      setDepositAmount("");
    },
  });

  const delMut = useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/v1/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  function submitGoal(e: React.FormEvent) {
    e.preventDefault();
    const body: GoalBody = {
      description: description.trim(),
      targetAmount: Number(targetAmount),
    };
    if (modal === "new") saveMut.mutate({ body });
    else if (modal && typeof modal === "object" && modal.id != null) {
      saveMut.mutate({ id: modal.id, body });
    }
  }

  function submitDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!depositFor?.id) return;
    depositMut.mutate({
      id: depositFor.id,
      body: { amount: Number(depositAmount) },
    });
  }

  function progress(current: number, target: number) {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  }

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Metas</h1>
          <p className="text-sm text-hh-muted">
            Poupança com valor atual e depósitos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal("new")}
          className="rounded-lg bg-hh-gold px-4 py-2 text-sm font-medium text-hh-bg hover:opacity-90"
        >
          Nova meta
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {list.isLoading && (
          <p className="text-hh-muted">Carregando…</p>
        )}
        {list.isError && (
          <p className="text-red-400">{(list.error as Error).message}</p>
        )}
        {list.data?.map((g) => {
          const cur = Number(g.currentAmount ?? 0);
          const tgt = Number(g.targetAmount ?? 0);
          const pct = progress(cur, tgt);
          return (
            <div
              key={g.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{g.description}</p>
                  <p className="mt-1 font-mono text-sm text-hh-muted">
                    {formatBrl(cur)} / {formatBrl(tgt)}
                  </p>
                </div>
                <div className="flex gap-2 text-sm">
                  <button
                    type="button"
                    className="text-hh-gold hover:underline"
                    onClick={() => setModal(g)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-sky-400 hover:underline"
                    onClick={() => {
                      setDepositFor(g);
                      setDepositAmount("");
                    }}
                  >
                    Depositar
                  </button>
                  <button
                    type="button"
                    className="text-red-400 hover:underline"
                    onClick={() => {
                      if (
                        g.id != null &&
                        window.confirm("Excluir esta meta?")
                      ) {
                        delMut.mutate(g.id);
                      }
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-emerald-500/80 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-sm text-hh-muted">{pct}% da meta</p>
            </div>
          );
        })}
        {list.data?.length === 0 && !list.isLoading && (
          <p className="text-hh-muted">Nenhuma meta ainda.</p>
        )}
      </div>

      <Modal
        open={modal != null}
        title={modal === "new" ? "Nova meta" : "Editar meta"}
        onClose={() => setModal(null)}
      >
        <form onSubmit={submitGoal} className="flex flex-col gap-3">
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
            <span className="text-hh-muted">Valor alvo (R$)</span>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
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

      <Modal
        open={depositFor != null}
        title={depositFor ? `Depósito — ${depositFor.description}` : "Depósito"}
        onClose={() => setDepositFor(null)}
      >
        <form onSubmit={submitDeposit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-hh-muted">Valor (R$)</span>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
          {depositMut.isError && (
            <p className="text-sm text-red-400">
              {(depositMut.error as Error).message}
            </p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDepositFor(null)}
              className="rounded-lg px-4 py-2 text-sm text-hh-muted hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={depositMut.isPending}
              className="rounded-lg bg-hh-gold px-4 py-2 text-sm font-medium text-hh-bg disabled:opacity-50"
            >
              {depositMut.isPending ? "Registrando…" : "Confirmar"}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
