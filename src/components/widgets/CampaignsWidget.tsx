import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { storagePublicUrl } from "../../lib/storage";

type AnyRow = Record<string, any>;

/** Kemungkinan nama kolom gambar di tabel campaign */
const IMG_KEYS = [
  "hero_image_url", // penting di projectmu
  "cover_url", "image_url", "thumbnail", "thumb_url", "banner_url",
  "image", "foto", "gambar", "cover", "thumb", "picture", "photo",
  "img", "img_url", "media_url", "poster", "logo",
];

function pickImageValue(r: AnyRow): string | null {
  for (const k of IMG_KEYS) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v as string;
  }
  return null;
}

function pickDate(r: AnyRow): string | null {
  return r.published_at || r.updated_at || r.created_at || null;
}

function pickSlug(r: AnyRow): string {
  return r.slug || r.id;
}

export default function CampaignsWidget({
  limit = 5,
  tableName = "campaigns",
}: {
  limit?: number;
  tableName?: string;
}) {
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(null);
      setLoading(true);

      let data: AnyRow[] = [];
      try {
        const { data: d } = await supabase
          .from(tableName)
          .select("*")
          .order("published_at", { ascending: false })
          .limit(limit);
        data = (d as AnyRow[]) || [];
      } catch {
        const { data: d2, error: e2 } = await supabase
          .from(tableName)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (e2) setErr(e2.message);
        data = (d2 as AnyRow[]) || [];
      }

      if (!alive) return;
      setRows(data);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [limit, tableName]);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold">Butuh Donasi Anda</div>

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-16 w-16 animate-pulse rounded bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-2/5 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && rows.length === 0 && (
        <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">
          Belum ada campaign yang dapat ditampilkan.
        </div>
      )}

      {/* List */}
      {!loading && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((c) => {
            const rawImg = pickImageValue(c);
            const img = storagePublicUrl(rawImg, "publicimages");
            const date = pickDate(c);
            const slug = pickSlug(c);

            // badge/angka progress (gunakan yang ada di tabelmu)
            const urgent = Boolean(c.is_urgent ?? c.is_featured ?? false);
            const raised = Number(c.raised ?? c.raised_amount ?? c.collected ?? 0);
            const target = Number(c.target ?? c.target_amount ?? c.goal ?? 0);
            const pct =
              target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

            return (
              <a
                key={c.id || slug}
                href={`/campaign/${slug}`}
                className="group flex gap-3 rounded-xl border p-3 ring-emerald-500/30 transition hover:bg-emerald-50 hover:ring-2"
                aria-label={`Buka campaign ${c.title || ""}`}
              >
                <div className="relative aspect-square w-16 overflow-hidden rounded-lg bg-slate-100">
                  {img ? (
                    <img
                      src={img}
                      alt={c.title || "Campaign"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // jika 404/403, sembunyikan gambar agar tetap rapi
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500">
                      {String(c.title || "C").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="line-clamp-2 text-sm font-medium leading-snug group-hover:underline">
                      {c.title || "(Tanpa judul)"}
                    </div>
                    {urgent && (
                      <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                        Mendesak
                      </span>
                    )}
                  </div>

                  {date && (
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {new Date(date).toLocaleDateString("id-ID")}
                    </div>
                  )}

                  {target > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full overflow-hidden rounded bg-slate-200">
                        <div
                          className="h-full bg-emerald-500 transition-[width] duration-300"
                          style={{ width: `${pct}%` }}
                          aria-label={`Terkumpul ${pct}%`}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Terkumpul Rp{raised.toLocaleString("id-ID")}</span>
                        <span>
                          Target Rp{target.toLocaleString("id-ID")} · {pct}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {err && (
        <div className="mt-3 rounded bg-amber-100 px-3 py-2 text-sm text-amber-900">
          {err}
        </div>
      )}
    </div>
  );
}
