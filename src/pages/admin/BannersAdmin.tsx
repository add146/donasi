// src/pages/admin/BannersAdmin.tsx
import { supabase } from "../../lib/supabase";
import type { Banner } from "../../types/banner";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { storagePublicUrl } from "../../lib/storage";

// ==== App Promo (Global) – tipe & default ====
type AppPromoContent = {
  visible?: boolean;
  image?: string | null;   // URL publik (supabase/external)
  playUrl?: string;        // Google Play
  appUrl?: string;         // App Store (opsional)

  // Tambahan teks:
  title?: string;          // Judul besar
  subtitle?: string;       // Subjudul
  downloadText?: string;   // Teks di atas badge store
  bullets?: string[];      // List di bawahnya (max 5)
};

const APP_PROMO_DEFAULT: AppPromoContent = {
  visible: true,
  image: null,
  playUrl: "https://play.google.com/store",
  appUrl: "https://www.apple.com/app-store/",
  title: "Berbuat baik setiap hari menjadi lebih mudah",
  subtitle:
    "Kelola donasi, ikuti perkembangan penyaluran bantuan, dan dapatkan notifikasi kegiatan terbaru langsung dari genggaman Anda.",
  downloadText: "Download aplikasi GRAHA KITA",
  bullets: [
    "Notifikasi real-time penyaluran & laporan",
    "Donasi aman, cepat, dan terdokumentasi",
    "Program pilihan yang kurasi & transparan",
  ],
};

export default function BannersAdmin() {
  const [rows, setRows] = useState<Banner[]>([]);
  const [q, setQ] = useState("");

  // ==== STATE App Promo ====
  const [appLoading, setAppLoading] = useState(true);
  const [appSaving, setAppSaving] = useState(false);
  const [appPromo, setAppPromo] = useState<AppPromoContent>(APP_PROMO_DEFAULT);
  const appFileRef = useRef<HTMLInputElement | null>(null);

  // muat konfigurasi "app_promo" sekali
  useEffect(() => {
    (async () => {
      setAppLoading(true);
      const { data } = await supabase
        .from("site_content")
        .select("data")
        .eq("key", "app_promo")
        .maybeSingle();

      const d = (data?.data as AppPromoContent) ?? {};
      const merged: AppPromoContent = {
        ...APP_PROMO_DEFAULT,
        ...d,
        bullets:
          (d.bullets && d.bullets.length ? d.bullets : APP_PROMO_DEFAULT.bullets)!.slice(0, 5),
      };
      setAppPromo(merged);
      setAppLoading(false);
    })();
  }, []);

  async function handleUploadAppImage() {
    const f = appFileRef.current?.files?.[0];
    if (!f) return;
    const path = `app-promo/${Date.now()}_${f.name}`;
    const up = await supabase.storage.from("publicimages").upload(path, f, { upsert: false });
    if (up.error) return alert(up.error.message);
    const { data } = supabase.storage.from("publicimages").getPublicUrl(path);
    setAppPromo((s) => ({ ...s, image: data.publicUrl }));
  }

  async function saveAppPromo() {
    setAppSaving(true);
    try {
      const normalizedImage =
        storagePublicUrl(appPromo.image || null, "publicimages") || appPromo.image || null;

      const payload: AppPromoContent = {
        visible: appPromo.visible ?? true,
        image: normalizedImage,
        playUrl: appPromo.playUrl || APP_PROMO_DEFAULT.playUrl!,
        appUrl: appPromo.appUrl || APP_PROMO_DEFAULT.appUrl!,
        title: (appPromo.title || "").trim() || APP_PROMO_DEFAULT.title!,
        subtitle: (appPromo.subtitle || "").trim() || APP_PROMO_DEFAULT.subtitle!,
        downloadText: (appPromo.downloadText || "").trim() || APP_PROMO_DEFAULT.downloadText!,
        bullets: (appPromo.bullets || [])
          .map((s) => (s || "").trim())
          .filter(Boolean)
          .slice(0, 5),
      };

      const { error } = await supabase
        .from("site_content")
        .upsert({ key: "app_promo", data: payload }, { onConflict: "key" });

      if (error) throw error;
      alert("App Promo tersimpan ✅");
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setAppSaving(false);
    }
  }

  // load daftar banners (tetap seperti sebelumnya)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(200);
      setRows((data as Banner[]) || []);
    })();
  }, []);

  const filtered = rows.filter((r) =>
    [r.title, (r.slots || []).join(","), r.status].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Banners</h1>
        <Link to="/admin/banners/new" className="rounded-lg bg-emerald-600 px-4 py-2 text-white">
          Buat Baru
        </Link>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 w-full rounded-lg border p-2"
        placeholder="Cari judul/slot/status…"
      />

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">Judul</th>
              <th className="p-2 text-left">Slots</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Jadwal</th>
              <th className="p-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-2">{b.title}</td>
                <td className="p-2">{(b.slots || []).join(", ")}</td>
                <td className="p-2">{b.status}</td>
                <td className="p-2">
                  {(b.start_at || "") && new Date(b.start_at!).toLocaleString("id-ID")} –{" "}
                  {(b.end_at || "") && new Date(b.end_at!).toLocaleString("id-ID")}
                </td>
                <td className="p-2">
                  <Link to={`/admin/banners/${b.id}`} className="text-emerald-700 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-4 text-slate-500" colSpan={5}>
                  Belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PENGATURAN APP PROMO (GLOBAL) – tampil di bawah list banner ===== */}
      <hr className="my-8" />
      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">App Promo (Global)</h2>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!appPromo.visible}
              onChange={(e) => setAppPromo((s) => ({ ...s, visible: e.target.checked }))}
            />
            Tampilkan di beranda
          </label>
        </div>

        {appLoading ? (
          <div className="text-slate-500">Memuat…</div>
        ) : (
          <>
            {/* Teks */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Judul</span>
                <input
                  className="mt-1 w-full rounded-lg border p-2"
                  value={appPromo.title || ""}
                  onChange={(e) => setAppPromo((s) => ({ ...s, title: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Subjudul</span>
                <input
                  className="mt-1 w-full rounded-lg border p-2"
                  value={appPromo.subtitle || ""}
                  onChange={(e) => setAppPromo((s) => ({ ...s, subtitle: e.target.value }))}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-medium">Teks di atas tautan store</span>
                <input
                  className="mt-1 w-full rounded-lg border p-2"
                  value={appPromo.downloadText || ""}
                  onChange={(e) => setAppPromo((s) => ({ ...s, downloadText: e.target.value }))}
                />
              </label>
            </div>

            {/* Media & URL */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Gambar (URL atau upload)</span>
                <input
                  className="mt-1 w-full rounded-lg border p-2"
                  placeholder="https://… atau publicimages/app-promo/xxx.jpg"
                  value={appPromo.image || ""}
                  onChange={(e) => setAppPromo((s) => ({ ...s, image: e.target.value }))}
                />
              </label>

              <div className="flex items-end gap-2">
                <input type="file" ref={appFileRef} className="w-full rounded-lg border p-2" />
                <button
                  onClick={handleUploadAppImage}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-white"
                >
                  Upload
                </button>
              </div>

              <label className="block">
                <span className="text-sm font-medium">Google Play URL</span>
                <input
                  className="mt-1 w-full rounded-lg border p-2"
                  placeholder="https://play.google.com/…"
                  value={appPromo.playUrl || ""}
                  onChange={(e) => setAppPromo((s) => ({ ...s, playUrl: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">App Store URL (opsional)</span>
                <input
                  className="mt-1 w-full rounded-lg border p-2"
                  placeholder="https://apps.apple.com/…"
                  value={appPromo.appUrl || ""}
                  onChange={(e) => setAppPromo((s) => ({ ...s, appUrl: e.target.value }))}
                />
              </label>
            </div>

            {/* Bullets */}
            <div className="mt-4">
              <div className="mb-2 text-sm font-medium">Teks list (maks. 5 baris)</div>
              <div className="space-y-2">
                {(appPromo.bullets || []).map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="w-full rounded-lg border p-2"
                      value={v}
                      onChange={(e) => {
                        const arr = [...(appPromo.bullets || [])];
                        arr[i] = e.target.value;
                        setAppPromo((s) => ({ ...s, bullets: arr }));
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-lg border px-3 py-2"
                      onClick={() => {
                        const arr = [...(appPromo.bullets || [])];
                        arr.splice(i, 1);
                        setAppPromo((s) => ({ ...s, bullets: arr }));
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
                {(appPromo.bullets || []).length < 5 && (
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-2 text-sm"
                    onClick={() =>
                      setAppPromo((s) => ({ ...s, bullets: [...(s.bullets || []), ""] }))
                    }
                  >
                    + Tambah baris
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Preview kecil */}
        {appPromo.image ? (
          <div className="mt-4 overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="relative w-full bg-slate-100" style={{ aspectRatio: "1200/900" }}>
              <img
                src={
                  storagePublicUrl(appPromo.image || null, "publicimages") ||
                  appPromo.image ||
                  ""
                }
                alt="Preview App Promo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="px-3 py-2 text-xs text-slate-600">Preview App Promo</div>
          </div>
        ) : null}

        <div className="mt-4">
          <button
            onClick={saveAppPromo}
            disabled={appSaving}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {appSaving ? "Menyimpan…" : "Simpan App Promo"}
          </button>
        </div>
      </section>
    </div>
  );
}
