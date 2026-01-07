export function fmtIDR(n: number | null | undefined) {
  const v = typeof n === "number" ? n : 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function percent(raised: number | null | undefined, target: number | null | undefined) {
  const r = Math.max(0, Number(raised || 0));
  const t = Math.max(0, Number(target || 0));
  return t > 0 ? Math.min(100, Math.round((r / t) * 100)) : 0;
}
