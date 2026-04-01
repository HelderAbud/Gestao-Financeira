"use client";

import { useState } from "react";

/** Mês/ano corrente como valor inicial — útil para filtros de lançamentos. */
export function usePeriod() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  return { year, month, setYear, setMonth };
}
