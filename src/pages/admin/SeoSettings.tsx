// src/pages/admin/SeoSettings.tsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useSeo } from "../../context/SeoContext";

type SeoSettings = {
  siteTitle?: string;
  siteDescription?: string;
  siteUrl?: string;
  defaultOgImage?: string | null;
  locale?: string;
  themeColor?: string;
  social?: { twitter?: string; facebook?: string; instagram?: string };
};

type SeoPage = {
  path: string;              // ex: "/", "/tentang-kami", "/p/slug", "/campaign/slug"
  title?: string | null;
  description?: string | null;
  image?: string | null;
  noindex?: boolean;
};

type SiteContentRow = { key: string; data: any };

const STORAGE_BUCKET =
  (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET as string) || "public"; // ganti kalau bucket-mu beda (mis. "publicimages")

async function fetchContent<T = any>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from("site_content")
    .select("data")
    .eq("key", key)
    .maybeSingle();
  if (error) {
    console.error("fetchContent error:", error);
    return null;
  }
  return (data?.data as T) ?? null;
}

async function upsertContent(key: string, data: any) {
  const payload: SiteContentRow = { key, data };
  const { error } = await supabase
    .from("site_content")
    .upsert(payload, { onConflict: "key" });
  if (error) throw error;
}

function classBtn(kind: "primary" | "ghost" | "danger" = "primary") {
  if (kind === "primary") return "px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700";
  if (kind === "danger") return "px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700";
  return "px-4 py-2 rounded border border-slate-300 hover:bg-slate-50";
}

export default function SeoSettings() {
  const { refresh } = useSeo();

  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SeoSettings>({
    siteTitle: "Graha Kita – Donasi Al-Qur’an & Kegiatan Sosial",
    siteDescription:
      "Bantu sebarkan Al-Qur’an dan salurkan bantuan kemanusiaan bersama Graha Kita. Donasi mudah, transparan, berdampak nyata.",
    siteUrl: "https://www.grahakita.id",
    defaultOgImage: null,
    locale: "id_ID",
    themeColor: "#0ea5e9",
    social: {},
  });
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [buildState, setBuildState] = useState<"idle" | "posting" | "done" | "error">("idle");

  const ogPreviewUrl = useMemo(() => {
  const title = (settings.siteTitle || "").trim();
  const sub   = (settings.siteDescription || "").trim();
  const brand = (settings.siteUrl || "").replace(/^https?:\/\//, "") || "grahakita.id";
  return `/.netlify/functions/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(sub)}&brand=${encodeURIComponent(brand)}`;
  }, [settings.siteTitle, settings.siteDescription, settings.siteUrl]);

  useEffect(() => {
    (async () => {
      const s = await fetchContent<SeoSettings>("seo_settings");
      if (s) setSettings((prev) => ({ ...prev, ...s }));
      const p = await fetchContent<SeoPage[]>("seo_pages");
      if (p) setPages(Array.isArray(p) ? p : []);
    })();
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      await upsertContent("seo_settings", settings);
      await upsertContent("seo_pages", pages);
      await refresh();
      alert("SEO settings disimpan ✅");
    } catch (e: any) {
      console.error(e);
      alert("Gagal menyimpan SEO settings: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadOg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `seo/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;

      const { data } = supabase
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path);

      if (!data?.publicUrl) throw new Error("Public URL tidak tersedia");
      setSettings((s) => ({ ...s, defaultOgImage: data.publicUrl }));
    } catch (err: any) {
      console.error(err);
      alert("Upload gagal: " + err.message + "\nCek nama bucket & policy public read.");
    } finally {
      // reset input
      e.currentTarget.value = "";
    }
  }

  function addPage() {
    setPages((arr) => [
      ...arr,
      { path: "/", title: "", description: "", image: "", noindex: false },
    ]);
  }

  function updatePage(i: number, patch: Partial<SeoPage>) {
    setPages((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function removePage(i: number) {
    setPages((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function triggerNetlifyBuild() {
    const hook = import.meta.env.VITE_NETLIFY_BUILD_HOOK_URL as string | undefined;
    if (!hook) {
      alert("Set env VITE_NETLIFY_BUILD_HOOK_URL agar bisa trigger deploy Netlify.");
      return;
    }
    try {
      setBuildState("posting");
      const res = await fetch(hook, { method: "POST" });
      if (!res.ok) throw new Error("Build hook gagal: " + res.status);
      setBuildState("done");
      alert("Deploy dipicu. Netlify akan rebuild situs 👍");
    } catch (e: any) {
      setBuildState("error");
      alert("Gagal trigger deploy: " + e.message);
    } finally {
      setTimeout(() => setBuildState("idle"), 1500);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">SEO Settings</h1>

      {/* GLOBAL SETTINGS */}
      <section className="bg-white rounded-2xl shadow p-4 mb-6 space-y-3">
        <h2 className="text-lg font-semibold">Global</h2>

        <label className="block">
          <span className="text-sm">Site Title</span>
          <input
            className="mt-1 w-full border rounded p-2"
            value={settings.siteTitle || ""}
            onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="text-sm">Site Description</span>
          <textarea
            className="mt-1 w-full border rounded p-2"
            rows={3}
            value={settings.siteDescription || ""}
            onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm">Canonical Domain (siteUrl)</span>
            <input
              className="mt-1 w-full border rounded p-2"
              value={settings.siteUrl || ""}
              onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
              placeholder="https://www.grahakita.id"
            />
          </label>
          <label className="block">
            <span className="text-sm">Locale</span>
            <input
              className="mt-1 w-full border rounded p-2"
              value={settings.locale || ""}
              onChange={(e) => setSettings({ ...settings, locale: e.target.value })}
              placeholder="id_ID"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm">Theme Color</span>
            <input
              type="color"
              className="mt-1 h-[42px] w-[80px] border rounded p-1"
              value={settings.themeColor || "#0ea5e9"}
              onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
            />
          </label>

          <div className="block">
            <span className="text-sm">Default OG Image</span>
            <div className="flex gap-2 items-center mt-1">
              <input
                className="flex-1 w-full border rounded p-2"
                value={settings.defaultOgImage || ""}
                onChange={(e) =>
                  setSettings({ ...settings, defaultOgImage: e.target.value })
                }
                placeholder="https://.../og.jpg"
              />
              <input type="file" accept="image/*" onChange={handleUploadOg} />
            </div>
            {settings.defaultOgImage && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.defaultOgImage}
                  alt="OG preview"
                  className="h-24 rounded border object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm">Twitter</span>
            <input
              className="mt-1 w-full border rounded p-2"
              value={settings.social?.twitter || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  social: { ...settings.social, twitter: e.target.value },
                })
              }
              placeholder="@username"
            />
          </label>
          <label className="block">
            <span className="text-sm">Facebook</span>
            <input
              className="mt-1 w-full border rounded p-2"
              value={settings.social?.facebook || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  social: { ...settings.social, facebook: e.target.value },
                })
              }
              placeholder="page"
            />
          </label>
          <label className="block">
            <span className="text-sm">Instagram</span>
            <input
              className="mt-1 w-full border rounded p-2"
              value={settings.social?.instagram || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  social: { ...settings.social, instagram: e.target.value },
                })
              }
              placeholder="@username"
            />
          </label>
        </div>
      </section>

      {/* PER-PAGE OVERRIDES */}
      <section className="bg-white rounded-2xl shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Per-Page Overrides</h2>
          <button onClick={addPage} className={classBtn("ghost")}>
            Tambah
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-3">
          Contoh path: <code>/</code>, <code>/tentang-kami</code>, <code>/kontak</code>, <code>/p/artikel-slug</code>, <code>/campaign/slug</code>
        </p>

        <div className="space-y-3">
          {pages.map((p, i) => (
            <div key={i} className="border rounded p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-sm">Path</span>
                  <input
                    className="mt-1 w-full border rounded p-2"
                    value={p.path}
                    onChange={(e) => updatePage(i, { path: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm">Title</span>
                  <input
                    className="mt-1 w-full border rounded p-2"
                    value={p.title || ""}
                    onChange={(e) => updatePage(i, { title: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm">Image URL</span>
                  <input
                    className="mt-1 w-full border rounded p-2"
                    value={p.image || ""}
                    onChange={(e) => updatePage(i, { image: e.target.value })}
                    placeholder="https://.../og.jpg"
                  />
                </label>
              </div>

              <label className="block mt-2">
                <span className="text-sm">Description</span>
                <textarea
                  className="mt-1 w-full border rounded p-2"
                  rows={2}
                  value={p.description || ""}
                  onChange={(e) => updatePage(i, { description: e.target.value })}
                ></textarea>
              </label>

              <label className="inline-flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={!!p.noindex}
                  onChange={(e) => updatePage(i, { noindex: e.target.checked })}
                />
                <span className="text-sm">Noindex (sembunyikan dari mesin pencari)</span>
              </label>

              <div className="mt-2 text-right">
                <button onClick={() => removePage(i)} className={classBtn("danger")}>
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className={classBtn("primary")}>
          {saving ? "Menyimpan..." : "Simpan"}
        </button>

        <button onClick={triggerNetlifyBuild} className={classBtn("ghost")}>
          {buildState === "posting" ? "Triggering..." : "Publish SEO (Rebuild)"}
        </button>
      </div>
    </div>
  );
}
