// src/pages/admin/ArticlesAdmin.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2, FiExternalLink } from "react-icons/fi";
import { supabase } from "../../lib/supabase";

/** ===== Types (sesuaikan dengan kolom yang dipakai) ===== */
type Row = {
  id: string;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  cover_url: string | null;    // bisa URL penuh / path bucket
  status: "draft" | "published" | null;
  published_at: string | null;
  updated_at: string | null;
  created_at: string | null;
};

/** ===== Helpers ===== */
const isHttp = (v?: string | null) => !!v && /^https?:\/\//i.test(v);
const toPublic = (v?: string | null) => {
  if (!v) return "";
  if (isHttp(v)) return v;
  const { data } = supabase.storage.from("publicimages").getPublicUrl(v);
  return data.publicUrl;
};
const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-";

/** ===== Page ===== */
export default function ArticlesAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // toggle tampil/sembunyi section artikel di public home
  const [enabled, setEnabled] = useState<boolean>(true);
  const [savingToggle, setSavingToggle] = useState(false);

  const nav = useNavigate();

  /** Load list */
  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("id,title,slug,excerpt,cover_url,status,published_at,updated_at,created_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false, nullsFirst: true });
    if (error) {
      setMsg(error.message);
      setRows([]);
    } else {
      setMsg(null);
      setRows((data as Row[]) ?? []);
    }
    setLoading(false);
  }

  /** Load toggle from site_content(key='home').data.sections.articles.enabled */
  async function loadToggle() {
    const { data } = await supabase
      .from("site_content")
      .select("data")
      .eq("key", "home")
      .maybeSingle();

    const on = data?.data?.sections?.articles?.enabled;
    setEnabled(on !== false); // default true
  }

  useEffect(() => {
  load();
  loadToggle();

  const ch = supabase
    .channel("articles_admin")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "articles" },
      () => load()
    )
    .subscribe();

  return () => {
    // jangan return Promise dari cleanup
    try {
      // v2: aman dipanggil, abaikan promise-nya
      void supabase.removeChannel(ch);
      // kalau objek channel punya unsubscribe (beberapa versi)
      // ch.unsubscribe?.(); // opsional
    } catch {}
  };
}, []);


  /** Client-side filter */
  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows
      .map((r) => ({ ...r, cover: toPublic(r.cover_url) }))
      .filter((r) =>
        !term
          ? true
          : (r.title || "").toLowerCase().includes(term) ||
            (r.excerpt || "").toLowerCase().includes(term) ||
            (r.slug || "").toLowerCase().includes(term)
      );
  }, [rows, q]);

  /** Delete */
  async function onDelete(id: string) {
    if (!confirm("Hapus artikel ini?")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) return setMsg(error.message);
    setMsg("Artikel dihapus.");
    await load();
  }

  /** Save toggle */
  async function saveEnabled(next: boolean) {
    setEnabled(next);
    setSavingToggle(true);
    try {
      const { data: row } = await supabase
        .from("site_content")
        .select("id,data")
        .eq("key", "home")
        .maybeSingle();

      const current = (row?.data ?? {}) as any;
      const merged = {
        ...current,
        sections: {
          ...(current.sections ?? {}),
          articles: { ...(current.sections?.articles ?? {}), enabled: next },
        },
      };

      if (row?.id) {
        const { error } = await supabase
          .from("site_content")
          .update({ data: merged })
          .eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_content")
          .insert({ key: "home", data: merged });
        if (error) throw error;
      }
      setMsg("Pengaturan artikel diperbarui.");
    } catch (e: any) {
      setMsg(e?.message || "Gagal menyimpan pengaturan.");
    } finally {
      setSavingToggle(false);
    }
  }

  return (
    <section className="space-y-4 p-6">
      {msg && (
        <div className="rounded-lg bg-emerald-50 px-4 py-2 text-emerald-700">{msg}</div>
      )}

      {/* Toggle tampil di public home */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm flex items-center justify-between">
        <div>
          <div className="font-semibold">Tampilkan Artikel di Halaman Utama</div>
          <div className="text-sm text-gray-600">
            Jika dimatikan, section artikel pada public home disembunyikan.
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            className="sr-only"
            checked={enabled}
            onChange={(e) => saveEnabled(e.target.checked)}
            disabled={savingToggle}
          />
          <span className={["h-6 w-11 rounded-full transition-colors", enabled ? "bg-emerald-500" : "bg-gray-300"].join(" ")}>
            <span className={["block h-5 w-5 rounded-full bg-white translate-x-0.5 mt-0.5 transition-transform", enabled ? "translate-x-[22px]" : "translate-x-0"].join(" ")} />
          </span>
          <span className="text-sm">{enabled ? "Tampil" : "Sembunyi"}</span>
        </label>
      </div>

      {/* Header: judul + search + tombol baru */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Artikel</h1>
          <p className="text-sm text-gray-500">Kelola artikel yang tampil di situs.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="w-64 rounded-xl border px-3 py-2"
            placeholder="Cari judul / slug / ringkasan…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Link to="/admin/articles/new" className="btn-primary flex items-center gap-2">
            <FiPlus /> Tulis Baru
          </Link>
        </div>
      </div>

      {/* List gaya kartu (mirip GaleriAdmin) */}
      <div className="rounded-2xl border bg-white shadow-sm divide-y">
        {loading && <div className="p-6 text-gray-500">Memuat…</div>}

        {!loading && items.length === 0 && (
          <div className="p-6 text-gray-500">Belum ada artikel.</div>
        )}

        {!loading &&
          items.map((it) => {
            const isDraft = (it.status ?? "draft") !== "published";
            const publicLink = it.slug ? `/p/${it.slug}` : undefined;
            return (
              <div key={it.id} className="flex items-center gap-4 p-4">
                {/* thumbnail */}
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded ring-1 ring-gray-200 bg-gray-50">
                  {it.cover_url ? (
                    <img src={toPublic(it.cover_url)} alt={it.title ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-gray-400">
                      No Cover
                    </div>
                  )}
                </div>

                {/* info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate font-semibold">{it.title || "(Tanpa judul)"}</div>
                    <span
                      className={[
                        "rounded px-2 py-0.5 text-xs ring-1",
                        isDraft
                          ? "bg-slate-100 text-slate-700 ring-slate-200"
                          : "bg-emerald-50 text-emerald-700 ring-emerald-200",
                      ].join(" ")}
                    >
                      {isDraft ? "draft" : "published"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm text-gray-600 line-clamp-1">{it.excerpt || "—"}</div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    Dipublish: {fmt(it.published_at)} • Diubah: {fmt(it.updated_at)} • Slug:{" "}
                    <span className="font-mono">{it.slug || "-"}</span>
                  </div>
                </div>

                {/* actions */}
                <div className="flex items-center gap-2">
                  {publicLink && !isDraft && (
                    <a
                      href={publicLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn px-3 py-1.5 hover:bg-gray-100"
                      title="Lihat"
                    >
                      <FiExternalLink />
                    </a>
                  )}
                  <button
                    className="btn px-3 py-1.5 hover:bg-gray-100"
                    title="Edit"
                    onClick={() => nav(`/admin/articles/${it.id}`)}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="btn px-3 py-1.5 text-red-600 hover:bg-red-50"
                    title="Hapus"
                    onClick={() => onDelete(it.id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
