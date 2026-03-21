"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  const mutation = useMutation({
    mutationFn: async () => {
      const path =
        mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      return apiFetch<{ accessToken: string }>(path, {
        method: "POST",
        json: { email, password },
      });
    },
    onSuccess: (data) => {
      setToken(data.accessToken);
      router.push("/dashboard");
    },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <Link
        href="/"
        className="text-sm text-hh-muted transition hover:text-hh-gold"
      >
        ← Voltar ao início
      </Link>
      <div className="rounded-2xl border border-slate-800/90 bg-slate-950/50 p-8 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-2 text-sm text-hh-muted">
            API:{" "}
            <span className="font-mono text-xs text-slate-400">
              {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}
            </span>
          </p>
        </div>
        <form
          className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-hh-muted">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-hh-muted">Senha (mín. 8 no cadastro)</span>
          <input
            type="password"
            required
            minLength={mode === "register" ? 8 : 1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
          />
        </label>
        {mutation.isError && (
          <p className="text-sm text-red-400">
            {(mutation.error as Error).message}
          </p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg bg-hh-gold py-2 text-sm font-medium text-hh-bg disabled:opacity-50"
        >
          {mutation.isPending ? "Aguarde…" : mode === "login" ? "Entrar" : "Cadastrar"}
        </button>
      </form>
        <button
          type="button"
          className="mt-2 text-center text-sm text-hh-gold hover:underline"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Criar conta" : "Já tenho conta"}
        </button>
      </div>
    </main>
  );
}
