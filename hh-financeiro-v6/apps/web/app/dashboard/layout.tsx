"use client";

import type { components } from "@hh/types";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { apiFetch, getToken, setToken } from "@/lib/api";

type Me = components["schemas"]["UserMeResponse"];

const nav = [
  { href: "/dashboard", label: "Resumo" },
  { href: "/dashboard/expenses", label: "Despesas" },
  { href: "/dashboard/incomes", label: "Receitas" },
  { href: "/dashboard/subscriptions", label: "Assinaturas" },
  { href: "/dashboard/goals", label: "Metas" },
  { href: "/dashboard/budgets", label: "Orçamentos" },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<Me>("/api/v1/users/me"),
    enabled: !!getToken(),
  });

  function logout() {
    setToken(null);
    router.push("/");
  }

  if (!getToken()) return null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800/80 bg-slate-950/85 shadow-sm shadow-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-hh-gold">
              HH Financeiro
            </p>
            <p className="text-sm font-medium text-white">
              {me.data?.email ?? "…"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <nav className="flex gap-1">
              {nav.map(({ href, label }) => {
                const active =
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(href + "/"));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      active
                        ? "bg-hh-gold/15 text-hh-gold"
                        : "text-hh-muted hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <Link
              href="/"
              className="text-sm text-hh-muted hover:text-white"
            >
              Início
            </Link>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-hh-muted hover:text-red-400"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
