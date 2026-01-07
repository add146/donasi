import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

// ====== Bentuk data yang disimpan di table `site_content` (key: "howitworks")
type HIWItem = { title: string; description: string };
type HowItWorksContent = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  items?: HIWItem[]; // 4 item
  cta?: { label: string; href: string };
};

// ====== Default (sesuai layout di PublicHome – styling tidak diubah)
const DEFAULTS: HowItWorksContent = {
  visible: true,
  title: "Cara Kerja Donasi – Mudah, Aman, Transparan",
  subtitle:
    "Ikuti langkah singkat berikut. Dalam kurang dari 2 menit, donasi Anda siap disalurkan.",
  items: [
    {
      title: "Pilih Campaign",
      description:
        "Jelajahi campaign terkurasi dan baca detail penerima manfaat. Gunakan filter untuk menemukan yang paling menyentuh hati Anda.",
    },
    {
      title: "Isi Data & Donasi",
      description:
        "Masukkan nominal, data singkat, lalu pilih metode pembayaran yang aman (kartu, transfer bank, e-wallet).",
    },
    {
      title: "Verifikasi & Salurkan",
      description:
        "Tim kami memverifikasi transaksi dan menyalurkan bantuan secara tepat sasaran bersama mitra terpercaya.",
    },
    {
      title: "Terima Laporan",
      description:
        "Anda menerima notifikasi & ringkasan penggunaan dana. Ikuti progres penyaluran dari dashboard dan email.",
    },
  ],
  cta: { label: "Mulai Donasi Sekarang", href: "/campaigns" },
};

// ====== Helpers I/O ke table `site_content`
type Row = { key: string; data: any };

async function fetchContent<T>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from("site_content")
    .select("data")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as T) ?? null;
}

async function upsertContent(key: string, data: any) {
  const payload: Row = { key, data };
  const { error } = await supabase
    .from("site_content")
    .upsert(payload, { onConflict: "key" });
  if (error) throw error;
}

export default function HowItWorksAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<HowItWorksContent>(DEFAULTS);

  // helper update kartu
  const setItem = (idx: number, patch: Partial<HIWItem>) => {
    setCfg((prev) => {
      const items = (prev.items ?? DEFAULTS.items!).slice(0, 4);
      while (items.length < 4) items.push({ title: "", description: "" });
      items[idx] = { ...items[idx], ...patch };
      return { ...prev, items };
    });
  };

  // load dari DB
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchContent<HowItWorksContent>("howitworks");
        if (!data) {
          setCfg(DEFAULTS);
        } else {
          setCfg({
            ...DEFAULTS,
            ...data,
            items:
              data.items && data.items.length
                ? [...data.items, ...DEFAULTS.items!].slice(0, 4)
                : DEFAULTS.items,
          });
        }
      } catch (e) {
        console.error(e);
        setCfg(DEFAULTS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // simpan ke DB
  async function handleSave(next?: Partial<HowItWorksContent>) {
    setSaving(true);
    try {
      const payload: HowItWorksContent = {
        ...cfg,
        ...next,
        items: (cfg.items ?? DEFAULTS.items)!.slice(0, 4).map((it) => ({
          title: (it.title || "").trim(),
          description: (it.description || "").trim(),
        })),
        title: (cfg.title || "").trim(),
        subtitle: (cfg.subtitle || "").trim(),
        cta: {
          label: (cfg.cta?.label || DEFAULTS.cta!.label).trim(),
          href: (cfg.cta?.href || DEFAULTS.cta!.href).trim(),
        },
      };
      await upsertContent("howitworks", payload);
      alert("Pengaturan 'Cara Kerja' tersimpan ✅");
    } catch (e: any) {
      alert(`Gagal menyimpan: ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  }

  const disabled = saving || loading;

  const updateCta = (patch: Partial<{ label: string; href: string }>) =>
  setCfg(v => ({
    ...v,
    cta: {
      label: v.cta?.label ?? DEFAULTS.cta!.label,
      href:  v.cta?.href  ?? DEFAULTS.cta!.href,
      ...patch,
    },
  }));


  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Cara Kerja Donasi</h1>

      {loading ? (
        <div className="text-gray-500">Memuat…</div>
      ) : (
        <>
          {/* Visibility */}
          <label className="inline-flex items-center gap-2 mb-6">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={cfg.visible ?? true}
              onChange={(e) =>
                setCfg((v) => ({ ...v, visible: e.target.checked }))
              }
              disabled={disabled}
            />
            <span>Tampilkan section “Cara Kerja Donasi” di beranda</span>
          </label>

          {/* Headings */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Judul</label>
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={cfg.title ?? ""}
                onChange={(e) => setCfg((v) => ({ ...v, title: e.target.value }))}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subjudul</label>
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={cfg.subtitle ?? ""}
                onChange={(e) =>
                  setCfg((v) => ({ ...v, subtitle: e.target.value }))
                }
                disabled={disabled}
              />
            </div>
          </div>

          {/* Cards (4 item) */}
          <div className="rounded-2xl border p-4 mb-6">
            <div className="mb-3 font-semibold">Isi 4 Kartu</div>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="text-sm font-semibold mb-2">Kartu {i + 1}</div>
                  <label className="block text-xs text-gray-600">Judul</label>
                  <input
                    className="mb-2 w-full rounded-xl border px-3 py-2"
                    value={cfg.items?.[i]?.title ?? ""}
                    onChange={(e) => setItem(i, { title: e.target.value })}
                    disabled={disabled}
                  />
                  <label className="block text-xs text-gray-600">
                    Deskripsi (singkat)
                  </label>
                  <textarea
                    className="w-full rounded-xl border px-3 py-2 h-24"
                    value={cfg.items?.[i]?.description ?? ""}
                    onChange={(e) => setItem(i, { description: e.target.value })}
                    disabled={disabled}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border p-4 mb-6">
            <div className="mb-3 font-semibold">Tombol CTA</div>
            <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                {/* Label */}
<input
  className="w-full rounded-xl border px-3 py-2"
  value={cfg.cta?.label ?? ""}
  onChange={(e) => updateCta({ label: e.target.value })}
  disabled={disabled}
/>

{/* URL / Link */}
<input
  className="w-full rounded-xl border px-3 py-2"
  value={cfg.cta?.href ?? ""}
  onChange={(e) => updateCta({ href: e.target.value })}
  placeholder="/campaigns"
  disabled={disabled}
/>

              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSave()}
              disabled={disabled}
              className="px-4 py-2 rounded-2xl bg-black text-white disabled:opacity-60"
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
            <button
              onClick={() => setCfg(DEFAULTS)}
              disabled={disabled}
              className="px-4 py-2 rounded-2xl border"
              title="Kembalikan ke bawaan"
            >
              Reset ke Default
            </button>
          </div>
        </>
      )}
    </div>
  );
}
