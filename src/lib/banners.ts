import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import type { Banner } from "../types/banner";

// Weighted pick di client (sederhana, cepat)
function weightedPick(items: Banner[]): Banner | null {
  const total = items.reduce((s, b) => s + (b.weight || 1), 0);
  if (total <= 0) return items[0] ?? null;
  let r = Math.random() * total;
  for (const b of items) {
    r -= (b.weight || 1);
    if (r <= 0) return b;
  }
  return items[0] ?? null;
}

export function useBanners(slot: string, limit = 8) {
  const [rows, setRows] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError(null);
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .contains("slots", [slot])                // slot harus ada di array
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (!alive) return;
      if (error) setError(error.message);
      setRows((data as Banner[]) || []);
      setLoading(false);
    })();
    return () => { alive = false };
  }, [slot, limit]);

  const pick = useMemo(() => weightedPick(rows), [rows]);
  return { rows, pick, loading, error };
}
