"use client";

const MESES = [
  { v: 1, l: "Jan" },
  { v: 2, l: "Fev" },
  { v: 3, l: "Mar" },
  { v: 4, l: "Abr" },
  { v: 5, l: "Mai" },
  { v: 6, l: "Jun" },
  { v: 7, l: "Jul" },
  { v: 8, l: "Ago" },
  { v: 9, l: "Set" },
  { v: 10, l: "Out" },
  { v: 11, l: "Nov" },
  { v: 12, l: "Dez" },
];

export function PeriodFilter({
  year,
  month,
  onYear,
  onMonth,
}: {
  year: number;
  month: number;
  onYear: (y: number) => void;
  onMonth: (m: number) => void;
}) {
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-hh-muted">Mês</span>
        <select
          value={month}
          onChange={(e) => onMonth(Number(e.target.value))}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
        >
          {MESES.map(({ v, l }) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-hh-muted">Ano</span>
        <select
          value={year}
          onChange={(e) => onYear(Number(e.target.value))}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
