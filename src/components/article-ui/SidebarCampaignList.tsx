/**
 * SidebarCampaignList.tsx — Campaign Donasi Mendesak
 * --------------------------------------------------
 * - Mencoba filter "urgent" dengan beberapa kemungkinan kolom:
 *   is_urgent=true  | urgent=true | priority='urgent'
 * - Jika semua gagal, fallback ke campaign terbaru.
 * - Styling premium, ring highlight di hover.
 *
 * NOTE: ganti nama tabel/kolom jika berbeda.
 */
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Row = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  published_at?: string | null;
  is_urgent?: boolean | null;
  urgent?: boolean | null;
  priority?: string | null;
};

export default function SidebarCampaignList({ limit = 5 }: { limit?: number }) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      // helper runner supaya tahan banting terhadap kolom yang tidak ada
      async function tryQuery(q: any) {
        const { data, error } = await q;
        if (error) throw error;
        return (data as Row[]) || [];
      }

      let data: Row[] = [];
      try {
        // 1) is_urgent = true
        data = await tryQuery(
          supabase
            .from("campaigns")
            .select("id,title,slug,cover_url,published_at,is_urgent,urgent,priority")
            .eq("is_urgent", true)
            .order("published_at", { ascending: false })
            .limit(limit)
        );
      } catch {}

      if (!data.length) {
        try {
          // 2) urgent = true
          data = await tryQuery(
            supabase
              .from("campaigns")
              .select("id,title,slug,cover_url,published_at,is_urgent,urgent,priority")
              .eq("urgent", true)
              .order("published_at", { ascending: false })
              .limit(limit)
          );
        } catch {}
      }

      if (!data.length) {
        try {
          // 3) priority = 'urgent'
          data = await tryQuery(
            supabase
              .from("campaigns")
              .select("id,title,slug,cover_url,published_at,is_urgent,urgent,priority")
              .eq("priority", "urgent")
              .order("published_at", { ascending: false })
              .limit(limit)
          );
        } catch {}
      }

      if (!data.length) {
        // 4) fallback: terbaru
        const { data: d } = await supabase
          .from("campaigns")
          .select("id,title,slug,cover_url,published_at")
          .order("published_at", { ascending: false })
          .limit(limit);
        data = (d as Row[]) || [];
      }

      setRows(data);
    })();
  }, [limit]);

  if (!rows.length) return null;

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold">Campaign Mendesak</div>
      <div className="space-y-3">
        {rows.map(c => (
          <a
            key={c.id}
            href={`/campaign/${c.slug}`}
            className="group flex gap-3 rounded-xl border p-3 ring-emerald-500/30 transition hover:bg-emerald-50 hover:ring-2"
          >
            <div className="relative aspect-square w-16 overflow-hidden rounded-lg bg-slate-100">
              {c.cover_url && (
                <img src={c.cover_url} alt={c.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <div className="line-clamp-2 text-sm font-medium group-hover:underline">
                {c.title}
              </div>
              {c.published_at && (
                <div className="text-[11px] text-slate-500">
                  {new Date(c.published_at).toLocaleDateString("id-ID")}
                </div>
              )}
              {(c.is_urgent || c.urgent || c.priority === "urgent") && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                  Mendesak
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
