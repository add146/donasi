// src/components/Stories.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

/** ===== Types ===== */
type Row = {
  id: string;
  name: string;
  quote: string;
  avatar_url?: string | null; // ada proyek yg pakai avatar_url
  avatar?: string | null;     // ada juga yg pakai avatar
  sort_order?: number | null;
  status?: "draft" | "published";
  created_at?: string;
};

const DEFAULT_AVATAR =
  "https://placehold.co/120x120/EDEFF2/9AA3AF?text=%F0%9F%91%A5";

/** ===== Helpers ===== */
async function storiesEnabled(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("site_content")
      .select("data")
      .eq("key", "home")
      .maybeSingle();
    const on = (data as any)?.data?.sections?.stories?.enabled;
    return on !== false; // default ON
  } catch {
    return true;
  }
}

function toPublicUrl(pathOrUrl?: string | null) {
  const raw = (pathOrUrl || "").trim();
  if (!raw) return DEFAULT_AVATAR;
  if (/^https?:\/\//i.test(raw)) return raw;
  // coba publicimages, lalu fallback media
  const a = supabase.storage.from("publicimages").getPublicUrl(raw).data.publicUrl;
  if (a) return a;
  const b = supabase.storage.from("media").getPublicUrl(raw).data.publicUrl;
  return b || DEFAULT_AVATAR;
}

/** ===== Component ===== */
export default function Stories() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [idx, setIdx] = useState(0);

  // autoplay progress [0..1]
  const AUTO_MS = 5000;
  const [progress, setProgress] = useState(0);
  const pausedRef = useRef(false);
  const loopRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  /* Toggle check (sekali saat mount) */
  useEffect(() => {
    let alive = true;
    (async () => {
      const ok = await storiesEnabled();
      if (alive) setEnabled(ok);
    })();
    return () => { alive = false; };
  }, []);

  /* Load data ketika toggle ON */
  useEffect(() => {
    if (enabled !== true) return;
    let mounted = true;

    const load = async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("id,name,quote,avatar_url,avatar,sort_order,created_at,status")
        .eq("status", "published")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (error) {
        console.error("stories load error:", error);
        setRows([]);
      } else {
        setRows(data ?? []);
      }
    };

    load();

    const chan = supabase
      .channel("stories_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stories" },
        () => load()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(chan);
    };
  }, [enabled]);

  /* Normalize avatars */
  const stories = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      avatarSrc: toPublicUrl(r.avatar_url ?? r.avatar),
    }));
  }, [rows]);

  /* Autoplay + progress */
  const go = (n: number) => {
    if (!stories.length) return;
    setIdx((i) => (i + n + stories.length) % stories.length);
    setProgress(0);
  };

  useEffect(() => {
    if (enabled !== true || !stories.length) return;

    // timer progress (50ms step)
    const stepMs = 50;
    const start = Date.now();
    const tick = () => {
      if (pausedRef.current) {
        tickRef.current = window.setTimeout(tick, stepMs);
        return;
      }
      const elapsed = Date.now() - start;
      setProgress(Math.min(1, elapsed / AUTO_MS));
      if (elapsed >= AUTO_MS) {
        go(1);
      } else {
        tickRef.current = window.setTimeout(tick, stepMs);
      }
    };

    tick();
    return () => {
      if (tickRef.current) window.clearTimeout(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, stories.length, enabled]);

  // hover pause/resume
  const onPause = () => (pausedRef.current = true);
  const onResume = () => (pausedRef.current = false);

  /* Early returns */
  if (enabled === null) return null;
  if (enabled === false) return null;
  if (!stories.length) return null;

  const s = stories[idx];

  return (
    <section
      id="stories"
      className="
        relative overflow-hidden py-24
        bg-gradient-to-b from-slate-50 via-white to-slate-50
      "
    >
      {/* dekorasi latar: gradients + grid halus */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(60%_60%_at_20%_0%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(50%_50%_at_100%_20%,rgba(59,130,246,0.18),transparent_60%)]
        "
        aria-hidden
      />
      <div
        className="
          pointer-events-none absolute inset-0
          [mask-image:linear-gradient(to_bottom,white,transparent)]
          bg-[linear-gradient(to_right,rgba(2,6,23,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(2,6,23,0.06)_1px,transparent_1px)]
          bg-[size:20px_20px]
        "
        aria-hidden
      />

      <div className="container-app relative">
        <header className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-slate-600 bg-white/70 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Kisah Harapan
          </div>
          <h2 className="mt-3 text-3xl font-serif font-bold tracking-tight text-slate-900 md:text-4xl">
            Cerita dari Penerima Manfaat
          </h2>
          <p className="mt-2 text-slate-600">
            Bukti nyata dampak kebaikan Anda — langsung dari mereka yang merasakannya.
          </p>
        </header>

        {/* layout: kiri big card, kanan avatar rail */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
          {/* LEFT: Card “glass” */}
          <figure
            className="
              group relative overflow-hidden rounded-3xl border
              bg-white/70 backdrop-blur shadow-[0_10px_40px_rgba(2,6,23,0.08)]
            "
            onMouseEnter={onPause}
            onMouseLeave={onResume}
          >
            {/* glow efek */}
            <div className="pointer-events-none absolute -inset-1 rounded-[inherit] bg-[radial-gradient(120px_80px_at_var(--x,50%)_var(--y,0%),rgba(16,185,129,0.15),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* big quote mark */}
            <div className="absolute left-6 top-6 text-5xl text-amber-400/70 select-none">“</div>

            <div className="relative px-6 py-10 md:px-12 md:py-14">
              {/* avatar + name */}
              <div className="flex items-center justify-center gap-4">
                <img
                  src={s.avatarSrc}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                  }}
                  alt={s.name}
                  className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow-md"
                />
                <figcaption className="text-sm text-slate-600">
                  <div className="font-semibold text-slate-900">{s.name}</div>
                  <div className="text-xs">Penerima Manfaat</div>
                </figcaption>
              </div>

              {/* quote */}
              <blockquote className="mt-6">
                <p className="mx-auto max-w-3xl text-center text-xl italic leading-relaxed text-slate-800 md:text-[22px]">
                  {s.quote}
                </p>
              </blockquote>

              {/* controls + progress */}
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  aria-label="Sebelumnya"
                  onClick={() => go(-1)}
                  className="
                    inline-flex h-10 w-10 items-center justify-center rounded-full
                    border bg-white/80 backdrop-blur ring-1 ring-black/5
                    hover:bg-white transition
                  "
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>

                <div className="relative h-1 w-56 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="absolute inset-y-0 left-0 rounded-r-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-[width]"
                    style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                  />
                </div>

                <button
                  aria-label="Berikutnya"
                  onClick={() => go(1)}
                  className="
                    inline-flex h-10 w-10 items-center justify-center rounded-full
                    border bg-white/80 backdrop-blur ring-1 ring-black/5
                    hover:bg-white transition
                  "
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
          </figure>

          {/* RIGHT: Avatar rail (navigator) */}
          <aside
            className="rounded-3xl border bg-white/70 backdrop-blur p-3 shadow-[0_10px_40px_rgba(2,6,23,0.06)]"
            onMouseEnter={onPause}
            onMouseLeave={onResume}
          >
            <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
              {stories.map((it, i) => {
                const active = i === idx;
                return (
                  <button
                    key={it.id}
                    onClick={() => { setIdx(i); setProgress(0); }}
                    aria-selected={active}
                    className={[
                      "w-full rounded-2xl border px-3 py-2.5 transition text-left",
                      "flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400",
                      active
                        ? "bg-emerald-50/70 border-emerald-200/70 shadow-sm"
                        : "bg-white/80 hover:bg-slate-50 border-slate-200/80",
                    ].join(" ")}
                  >
                    <img
                      src={it.avatarSrc}
                      alt={it.name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white shadow"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR)}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{it.name}</div>
                      <div className="line-clamp-1 text-xs text-slate-600">{it.quote}</div>
                    </div>
                    {active && (
                      <span className="ml-auto inline-flex h-6 items-center rounded-full bg-emerald-100 px-2 text-[10px] font-semibold text-emerald-700">
                        Tampil
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
