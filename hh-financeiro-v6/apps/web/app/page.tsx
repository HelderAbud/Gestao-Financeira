import Link from "next/link";

const features = [
  { title: "Resumo mensal", desc: "Receitas, saídas, investimentos e saldo num só ecrã." },
  { title: "Lançamentos", desc: "Despesas e receitas por período, com categorias." },
  { title: "Metas e orçamentos", desc: "Poupança com progresso e planeamento por categoria." },
  { title: "API documentada", desc: "OpenAPI + tipos TypeScript gerados a partir do contrato." },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 pb-16 pt-12 sm:pt-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="inline-flex rounded-full border border-hh-gold/25 bg-hh-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-hh-gold">
          Portfólio · full-stack
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          HH Financeiro
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-hh-muted">
          Controle de finanças pessoais com backend Java e frontend Next.js — dados
          isolados por conta e autenticação JWT.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/login"
            className="inline-flex min-w-[220px] items-center justify-center rounded-xl bg-hh-gold px-6 py-3 text-sm font-semibold text-hh-bg shadow-lg shadow-hh-gold/20 transition hover:opacity-95"
          >
            Entrar ou criar conta
          </Link>
        </div>
      </div>

      <ul className="mt-16 grid gap-4 sm:grid-cols-2">
        {features.map(({ title, desc }) => (
          <li
            key={title}
            className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-5 shadow-lg shadow-black/20 backdrop-blur-sm transition hover:border-hh-gold/20"
          >
            <h2 className="font-medium text-white">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-hh-muted">{desc}</p>
          </li>
        ))}
      </ul>

      <p className="mt-12 text-center text-xs text-slate-600">
        Documentação: <code className="rounded bg-slate-900 px-3 py-1 text-slate-400">docs/</code> ·
        Deploy: <code className="rounded bg-slate-900 px-3 py-1 text-slate-400">docs/DEPLOY.md</code>
      </p>
    </main>
  );
}
