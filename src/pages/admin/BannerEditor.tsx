import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type { Banner } from "../../types/banner";
import { storagePublicUrl } from "../../lib/storage";

/** Ukuran tetap per slot (px) + aspect ratio untuk preview */
const SLOT_HINTS: Record<
  string,
  { label: string; size: string; aspect: `${number}/${number}` }
> = {
  article_inline:        { label: "Artikel (di tengah)",  size: "1200×375 px", aspect: "1200/375" },
  article_footer:        { label: "Artikel (footer)",     size: "1200×375 px", aspect: "1200/375" },
  sidebar_top:           { label: "Sidebar (atas)",       size: "300×250 px",  aspect: "300/250"  },
  sidebar_middle:        { label: "Sidebar (tengah)",     size: "300×250 px",  aspect: "300/250"  },
  sidebar_bottom:        { label: "Sidebar (bawah)",      size: "300×250 px",  aspect: "300/250"  },
  home_between_sections: { label: "Home (antar section)", size: "1200×400 px", aspect: "1200/400" },
};

const SLOT_OPTIONS = [
  "article_inline", "article_footer",
  "sidebar_top", "sidebar_middle", "sidebar_bottom",
  "home_between_sections",
];

/** Tentukan aspect preview berdasarkan slot yg dipilih */
function previewAspectFor(slots?: string[]): `${number}/${number}` {
  if (!slots || slots.length === 0) return "1200/375";                 // default artikel
  if (slots.some(s => s.startsWith("sidebar_"))) return "300/250";     // salah satu sidebar
  if (slots.includes("home_between_sections")) return "1200/400";
  return "1200/375";
}

export default function BannerEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();

  // Tanpa judul
  const [form, setForm] = useState<Partial<Banner>>({
    image_url: "",
    link_url: "",
    slots: [],
    status: "draft",
    weight: 1,
    start_at: null,
    end_at: null,
  });

  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      if (isNew) return;
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) alert(error.message);
      if (data) setForm(data as Banner);
    })();
  }, [id]); // eslint-disable-line

  async function handleUpload() {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    const path = `banners/${Date.now()}_${f.name}`;
    const up = await supabase.storage
      .from("publicimages")
      .upload(path, f, { upsert: false });
    if (up.error) return alert(up.error.message);
    const { data } = supabase.storage.from("publicimages").getPublicUrl(path);
    setForm((s) => ({ ...s, image_url: data.publicUrl }));
  }

  async function save(status?: "draft" | "active") {
    // normalisasi supaya path storage otomatis jadi URL publik
    const normalizedImageUrl =
      storagePublicUrl(form.image_url || null, "publicimages") ||
      form.image_url ||
      "";

    // kirim hanya field yang dipakai (tanpa title)
    const payload = {
      image_url: normalizedImageUrl,
      link_url: form.link_url ?? null,
      slots: form.slots || [],
      status: status ?? form.status ?? "draft",
      weight: form.weight || 1,
      start_at: form.start_at ?? null,
      end_at: form.end_at ?? null,
    };

    if (isNew) {
      const { data, error } = await supabase
        .from("banners")
        .insert(payload)
        .select("id")
        .maybeSingle();
      if (error) return alert(error.message);
      nav(`/admin/banners/${data!.id}`);
    } else {
      const { error } = await supabase
        .from("banners")
        .update(payload)
        .eq("id", id);
      if (error) return alert(error.message);
      alert("Tersimpan");
    }
  }

  const imgSrc = storagePublicUrl(form.image_url || null, "publicimages");
  const previewAspect = previewAspectFor(form.slots);

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isNew ? "Banner Baru" : "Edit Banner"}</h1>
      </div>

      <div className="space-y-4">
        {/* === Info slot (tanpa judul) === */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Link (opsional)</span>
            <input
              className="mt-1 w-full rounded-lg border p-2"
              value={form.link_url || ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, link_url: e.target.value }))
              }
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Bobot (weight)</span>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border p-2"
              value={form.weight || 1}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  weight: Number(e.target.value || 1),
                }))
              }
            />
          </label>
        </div>

        <div>
          <span className="text-sm font-medium">Peletakan (slots)</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {SLOT_OPTIONS.map((slot) => {
              const checked = (form.slots || []).includes(slot);
              return (
                <label
                  key={slot}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                    checked ? "border-emerald-300 bg-emerald-50" : "bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={checked}
                    onChange={() => {
                      setForm((s) => {
                        const arr = new Set(s.slots || []);
                        if (arr.has(slot)) arr.delete(slot);
                        else arr.add(slot);
                        return { ...s, slots: Array.from(arr) };
                      });
                    }}
                  />
                  {slot}
                </label>
              );
            })}
          </div>

          {/* Hints ukuran sesuai slot pilihan */}
          {form.slots && form.slots.length > 0 && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800">
              <div className="mb-1 font-semibold">
                Rekomendasi ukuran gambar (px):
              </div>
              <ul className="ml-4 list-disc space-y-1">
                {Array.from(new Set(form.slots)).map((s) => {
                  const h = SLOT_HINTS[s];
                  if (!h) return null;
                  return (
                    <li key={s}>
                      <span className="font-medium">{h.label}</span>:{" "}
                      <span className="font-medium">{h.size}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 text-[11px] text-emerald-700/90">
                Tips: gunakan JPG/PNG/WebP &lt; 1.5MB. Sisakan “area aman” 24–32px
                dari tepi untuk teks/logo.
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Gambar (URL atau upload)</span>
            <input
              className="mt-1 w-full rounded-lg border p-2"
              placeholder="Contoh: https://... atau publicimages/banners/nama-file.jpg"
              value={form.image_url || ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, image_url: e.target.value }))
              }
            />
          </label>
          <div className="flex items-end gap-2">
            <input type="file" ref={fileRef} className="w-full rounded-lg border p-2" />
            <button
              onClick={handleUpload}
              className="rounded-lg bg-slate-800 px-3 py-2 text-white"
            >
              Upload
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Mulai (opsional)</span>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border p-2"
              value={form.start_at ? form.start_at.slice(0, 16) : ""}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  start_at: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                }))
              }
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Berakhir (opsional)</span>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border p-2"
              value={form.end_at ? form.end_at.slice(0, 16) : ""}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  end_at: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                }))
              }
            />
          </label>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Artikel (inline/footer): <b>1200×375</b> · Sidebar: <b>300×250</b> ·
          Home antar section: <b>1200×400</b>.
        </p>

        {/* Preview gambar (ikut slot terpilih) */}
        {imgSrc && (
          <div className="mt-3 overflow-hidden rounded-xl border bg-white shadow-sm">
            <div
              className="relative w-full bg-slate-100"
              style={{ aspectRatio: previewAspect }}
            >
              <img src={imgSrc} alt="Preview banner" className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-600">
              <span className="truncate">Preview</span>
              <span className="truncate">
                Slots aktif: {form.slots?.length ? form.slots.join(", ") : "-"}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => save("draft")}
            className="rounded-lg bg-slate-200 px-4 py-2"
          >
            Simpan Draft
          </button>
          <button
            onClick={() => save("active")}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
