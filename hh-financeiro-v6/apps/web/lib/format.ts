const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBrl(n: number | undefined | null) {
  if (n === undefined || n === null) return "—";
  return brl.format(n);
}
