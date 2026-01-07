// src/pages/admin/AboutAdmin.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  AboutPageContent,
  DEFAULT_ABOUT,
  AboutStatsItem,
  AboutInfoCard,
  AboutValueItem,
  AboutTimelineItem,
  AboutTeamItem,
} from "../../types/siteContent";
import { uploadPublicImage, ensurePublicUrl } from "../../lib/uploadPublic";

type SiteContentRow = { key: string; data: any };

async function fetchContent<T = any>(key: string): Promise<T | null> {
  const { data } = await supabase
    .from("site_content")
    .select("data")
    .eq("key", key)
    .maybeSingle();
  return (data?.data as T) ?? null;
}

async function upsertContent(key: string, data: any) {
  const payload: SiteContentRow = { key, data };
  const { error } = await supabase.from("site_content").upsert(payload, { onConflict: "key" });
  if (error) throw error;
}

type Tab =
  | "hero"
  | "stats"
  | "mission"
  | "values"
  | "timeline"
  | "team"
  | "cta";

export default function AboutAdmin() {
  const [active, setActive] = useState<Tab>("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [about, setAbout] = useState<AboutPageContent>(DEFAULT_ABOUT);

  // Field bantu untuk URL eksternal gambar hero
  const [extHero, setExtHero] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const d = await fetchContent<AboutPageContent>("about");
      if (d) {
        setAbout({
          hero: { ...DEFAULT_ABOUT.hero, ...(d.hero || {}) },
          stats: { ...DEFAULT_ABOUT.stats, ...(d.stats || {}) },
          mission: { ...DEFAULT_ABOUT.mission, ...(d.mission || {}) },
          values: { ...DEFAULT_ABOUT.values, ...(d.values || {}) },
          timeline: { ...DEFAULT_ABOUT.timeline, ...(d.timeline || {}) },
          team: { ...DEFAULT_ABOUT.team, ...(d.team || {}) },
          cta: { ...DEFAULT_ABOUT.cta, ...(d.cta || {}) },
        });
        setExtHero(
          d.hero?.bgImage && /^https?:\/\//i.test(String(d.hero.bgImage)) ? String(d.hero.bgImage) : ""
        );
      }
      setLoading(false);
    })();
  }, []);

  async function saveAll() {
    setSaving(true);
    try {
      // normalisasi bg hero: jika ada eksternal → pakai itu
      const heroBg =
        (extHero?.trim() ? extHero.trim() : about.hero.bgImage) || null;

      const payload: AboutPageContent = {
        ...about,
        hero: { ...about.hero, bgImage: heroBg },
      };
      await upsertContent("about", payload);
      alert("Pengaturan ABOUT tersimpan ✅");
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  // ====== Handlers util ======
  async function uploadHero(file?: File | null) {
    if (!file) return;
    const url = await uploadPublicImage(file, "about");
    setAbout((cur) => ({ ...cur, hero: { ...cur.hero, bgImage: url } }));
    setExtHero("");
  }
  async function uploadTeam(idx: number, f?: File | null) {
    if (!f) return;
    const url = await uploadPublicImage(f, "about");
    setAbout((cur) => {
      const arr = [...cur.team.items];
      arr[idx] = { ...arr[idx], img: url };
      return { ...cur, team: { ...cur.team, items: arr } };
    });
  }

  // ====== BODY PER TAB ======
  const body = loading ? (
    <div className="text-gray-500">Memuat…</div>
  ) : active === "hero" ? (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Hero</h2>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!about.hero.visible}
            onChange={(e) =>
              setAbout((cur) => ({ ...cur, hero: { ...cur.hero, visible: e.target.checked } }))
            }
          />
          Tampilkan
        </label>
      </div>

      <label className="space-y-1 block">
        <span className="text-sm font-medium">Badge (kecil, opsional)</span>
        <input
          className="w-full rounded border px-3 py-2"
          value={about.hero.badge || ""}
          onChange={(e) => setAbout((c) => ({ ...c, hero: { ...c.hero, badge: e.target.value } }))}
        />
      </label>

      <label className="space-y-1 block">
        <span className="text-sm font-medium">Judul</span>
        <input
          className="w-full rounded border px-3 py-2"
          value={about.hero.title}
          onChange={(e) => setAbout((c) => ({ ...c, hero: { ...c.hero, title: e.target.value } }))}
        />
      </label>

      <label className="space-y-1 block">
        <span className="text-sm font-medium">Subjudul</span>
        <textarea
          className="w-full rounded border px-3 py-2 min-h-[100px]"
          value={about.hero.subtitle || ""}
          onChange={(e) =>
            setAbout((c) => ({ ...c, hero: { ...c.hero, subtitle: e.target.value } }))
          }
        />
      </label>

      {/* BG hero: upload / URL */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Background hero</span>
        {about.hero.bgImage ? (
          <div className="flex items-center gap-3">
            <img
              src={ensurePublicUrl(about.hero.bgImage) ?? ""}
              className="h-16 w-auto rounded border bg-white object-cover"
              alt="bg hero"
            />
            <button
              type="button"
              className="px-3 py-2 rounded border"
              onClick={() => {
                setAbout((c) => ({ ...c, hero: { ...c.hero, bgImage: null } }));
                setExtHero("");
                }}
            >
              Hapus
            </button>
          </div>
        ) : (
          <input type="file" accept="image/*" onChange={(e) => uploadHero(e.target.files?.[0] ?? null)} />
        )}

        <div className="text-center text-gray-400 text-xs">— atau —</div>
        <input
          type="url"
          inputMode="url"
          className="w-full rounded border px-3 py-2"
          placeholder="https://domain-kamu.com/about-hero.jpg"
          value={extHero}
          onChange={(e) => setExtHero(e.target.value)}
        />
        <p className="text-xs text-gray-500">Rekomendasi: 1600×700–900px, cover, center.</p>
      </div>
    </div>
  ) : active === "stats" ? (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Statistik Ringkas</h2>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!about.stats.visible}
            onChange={(e) => setAbout((c) => ({ ...c, stats: { ...c.stats, visible: e.target.checked } }))}
          />
          Tampilkan
        </label>
      </div>

      <button
        type="button"
        className="px-3 py-2 rounded border"
        onClick={() =>
          setAbout((c) => ({
            ...c,
            stats: {
              ...c.stats,
              items: [...c.stats.items, { label: "", value: "", icon: "", visible: true } as AboutStatsItem],
            },
          }))
        }
      >
        + Tambah Item
      </button>

      <div className="space-y-3">
        {about.stats.items.map((s, i) => (
          <div key={i} className="grid md:grid-cols-4 gap-2 rounded border p-3 bg-white">
            <input
              className="rounded border px-3 py-2"
              placeholder="Label"
              value={s.label}
              onChange={(e) => {
                const arr = [...about.stats.items];
                arr[i] = { ...arr[i], label: e.target.value };
                setAbout((c) => ({ ...c, stats: { ...c.stats, items: arr } }));
              }}
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Nilai"
              value={s.value}
              onChange={(e) => {
                const arr = [...about.stats.items];
                arr[i] = { ...arr[i], value: e.target.value };
                setAbout((c) => ({ ...c, stats: { ...c.stats, items: arr } }));
              }}
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Nama ikon (opsional, mis. FiUsers)"
              value={s.icon || ""}
              onChange={(e) => {
                const arr = [...about.stats.items];
                arr[i] = { ...arr[i], icon: e.target.value };
                setAbout((c) => ({ ...c, stats: { ...c.stats, items: arr } }));
              }}
            />
            <div className="flex items-center justify-end gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={s.visible !== false}
                  onChange={(e) => {
                    const arr = [...about.stats.items];
                    arr[i] = { ...arr[i], visible: e.target.checked };
                    setAbout((c) => ({ ...c, stats: { ...c.stats, items: arr } }));
                  }}
                />
                Tampil
              </label>
              <button
                className="px-3 py-2 rounded border text-red-600"
                onClick={() => {
                  const arr = [...about.stats.items];
                  arr.splice(i, 1);
                  setAbout((c) => ({ ...c, stats: { ...c.stats, items: arr } }));
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : active === "mission" ? (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Visi & Misi</h2>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!about.mission.visible}
            onChange={(e) => setAbout((c) => ({ ...c, mission: { ...c.mission, visible: e.target.checked } }))}
          />
          Tampilkan
        </label>
      </div>

      <MissionEditor
        label="Kartu Kiri (Visi)"
        value={about.mission.left}
        onChange={(v) => setAbout((c) => ({ ...c, mission: { ...c.mission, left: v } }))}
      />
      <MissionEditor
        label="Kartu Kanan (Misi)"
        value={about.mission.right}
        onChange={(v) => setAbout((c) => ({ ...c, mission: { ...c.mission, right: v } }))}
      />
    </div>
  ) : active === "values" ? (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Nilai-Nilai</h2>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!about.values.visible}
            onChange={(e) => setAbout((c) => ({ ...c, values: { ...c.values, visible: e.target.checked } }))}
          />
          Tampilkan
        </label>
      </div>

      <button
        type="button"
        className="px-3 py-2 rounded border"
        onClick={() =>
          setAbout((c) => ({
            ...c,
            values: { ...c.values, items: [...c.values.items, { title: "", desc: "", icon: "" } as AboutValueItem] },
          }))
        }
      >
        + Tambah Nilai
      </button>

      <div className="space-y-3">
        {about.values.items.map((v, i) => (
          <div key={i} className="grid md:grid-cols-[1fr,2fr,1fr,auto] gap-2 rounded border p-3 bg-white">
            <input
              className="rounded border px-3 py-2"
              placeholder="Judul"
              value={v.title}
              onChange={(e) => {
                const arr = [...about.values.items];
                arr[i] = { ...arr[i], title: e.target.value };
                setAbout((c) => ({ ...c, values: { ...c.values, items: arr } }));
              }}
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Deskripsi singkat"
              value={v.desc}
              onChange={(e) => {
                const arr = [...about.values.items];
                arr[i] = { ...arr[i], desc: e.target.value };
                setAbout((c) => ({ ...c, values: { ...c.values, items: arr } }));
              }}
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Ikon (opsional)"
              value={v.icon || ""}
              onChange={(e) => {
                const arr = [...about.values.items];
                arr[i] = { ...arr[i], icon: e.target.value };
                setAbout((c) => ({ ...c, values: { ...c.values, items: arr } }));
              }}
            />
            <button
              className="px-3 py-2 rounded border text-red-600"
              onClick={() => {
                const arr = [...about.values.items];
                arr.splice(i, 1);
                setAbout((c) => ({ ...c, values: { ...c.values, items: arr } }));
              }}
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
    </div>
 ) : active === "timeline" ? (
  <div className="max-w-3xl space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">Timeline / Perjalanan</h2>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!about.timeline.visible}
          onChange={(e) =>
            setAbout((c) => ({ ...c, timeline: { ...c.timeline, visible: e.target.checked } }))
          }
        />
        Tampilkan
      </label>
    </div>

    <button
      type="button"
      className="px-3 py-2 rounded border"
      onClick={() =>
        setAbout((c) => ({
          ...c,
          timeline: {
            ...c.timeline,
            items: [...c.timeline.items, { year: "", title: "", desc: "" } as AboutTimelineItem],
          },
        }))
      }
    >
      + Tambah Baris
    </button>

    <div className="space-y-3">
      {about.timeline.items.map((t, i) => (
        <div key={i} className="grid md:grid-cols-[120px,1fr,2fr,auto] gap-2 rounded border p-3 bg-white">
          <input
            className="rounded border px-3 py-2"
            placeholder="Tahun"
            value={t.year}
            onChange={(e) => {
              const arr = [...about.timeline.items];
              arr[i] = { ...arr[i], year: e.target.value };
              setAbout((c) => ({ ...c, timeline: { ...c.timeline, items: arr } }));
            }}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Judul"
            value={t.title}
            onChange={(e) => {
              const arr = [...about.timeline.items];
              arr[i] = { ...arr[i], title: e.target.value };
              setAbout((c) => ({ ...c, timeline: { ...c.timeline, items: arr } }));
            }}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Deskripsi"
            value={t.desc}
            onChange={(e) => {
              const arr = [...about.timeline.items];
              arr[i] = { ...arr[i], desc: e.target.value };
              setAbout((c) => ({ ...c, timeline: { ...c.timeline, items: arr } }));
            }}
          />
          <button
            className="px-3 py-2 rounded border text-red-600"
            onClick={() => {
              const arr = [...about.timeline.items];
              arr.splice(i, 1);
              setAbout((c) => ({ ...c, timeline: { ...c.timeline, items: arr } }));
            }}
          >
            Hapus
          </button>
        </div>
      ))}

      {/* Media Kanan (PPT) */}
      <div className="pt-4">
        <TimelineRightMediaForm
          pptUrl={about.timeline.media?.pptUrl || ""}
          caption={about.timeline.media?.caption || ""}
          onChange={(v) =>
            setAbout((c) => ({
              ...c,
              timeline: {
                ...c.timeline,
                media: { pptUrl: v.pptUrl, caption: v.caption },
              },
            }))
          }
        />
      </div>
    </div>
  </div>
) : active === "team" ? (

    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tim</h2>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!about.team.visible}
            onChange={(e) => setAbout((c) => ({ ...c, team: { ...c.team, visible: e.target.checked } }))}
          />
          Tampilkan
        </label>
      </div>

      <button
        type="button"
        className="px-3 py-2 rounded border"
        onClick={() =>
          setAbout((c) => ({
            ...c,
            team: { ...c.team, items: [...c.team.items, { name: "", role: "", img: null, visible: true } as AboutTeamItem] },
          }))
        }
      >
        + Tambah Anggota
      </button>

      <div className="space-y-3">
        {about.team.items.map((m, i) => (
          <div key={i} className="grid md:grid-cols-[1fr,1fr,auto] gap-2 rounded border p-3 bg-white">
            <div className="grid gap-2">
              <input
                className="rounded border px-3 py-2"
                placeholder="Nama"
                value={m.name}
                onChange={(e) => {
                  const arr = [...about.team.items];
                  arr[i] = { ...arr[i], name: e.target.value };
                  setAbout((c) => ({ ...c, team: { ...c.team, items: arr } }));
                }}
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Peran"
                value={m.role}
                onChange={(e) => {
                  const arr = [...about.team.items];
                  arr[i] = { ...arr[i], role: e.target.value };
                  setAbout((c) => ({ ...c, team: { ...c.team, items: arr } }));
                }}
              />
              <input
                type="url"
                inputMode="url"
                className="rounded border px-3 py-2"
                placeholder="URL foto (opsional)"
                value={m.img || ""}
                onChange={(e) => {
                  const arr = [...about.team.items];
                  arr[i] = { ...arr[i], img: e.target.value };
                  setAbout((c) => ({ ...c, team: { ...c.team, items: arr } }));
                }}
              />
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={(e) => uploadTeam(i, e.target.files?.[0] ?? null)} />
                {m.img ? (
                  <img
                    src={ensurePublicUrl(m.img) ?? ""}
                    alt={m.name}
                    className="h-10 w-10 rounded object-cover border"
                  />
                ) : null}
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={m.visible !== false}
                  onChange={(e) => {
                    const arr = [...about.team.items];
                    arr[i] = { ...arr[i], visible: e.target.checked };
                    setAbout((c) => ({ ...c, team: { ...c.team, items: arr } }));
                  }}
                />
                Tampilkan
              </label>
            </div>

            <div className="md:col-start-3 flex md:flex-col items-center md:items-end gap-2">
              <button
                className="px-3 py-2 rounded border"
                onClick={() => {
                  const arr = [...about.team.items];
                  if (i === 0) return;
                  const [it] = arr.splice(i, 1);
                  arr.splice(i - 1, 0, it);
                  setAbout((c) => ({ ...c, team: { ...c.team, items: arr } }));
                }}
              >
                ↑
              </button>
              <button
                className="px-3 py-2 rounded border"
                onClick={() => {
                  const arr = [...about.team.items];
                  if (i >= arr.length - 1) return;
                  const [it] = arr.splice(i, 1);
                  arr.splice(i + 1, 0, it);
                  setAbout((c) => ({ ...c, team: { ...c.team, items: arr } }));
                }}
              >
                ↓
              </button>
              <button
                className="px-3 py-2 rounded border text-red-600"
                onClick={() => {
  const arr = [...about.team.items];
  arr.splice(i, 1);
  setAbout((c) => ({ ...c, team: { ...c.team, items: arr } }));
}}
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    // CTA
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">CTA Bawah</h2>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!about.cta.visible}
            onChange={(e) => setAbout((c) => ({ ...c, cta: { ...c.cta, visible: e.target.checked } }))}
          />
          Tampilkan
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs text-gray-600">Judul</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={about.cta.title}
            onChange={(e) => setAbout((c) => ({ ...c, cta: { ...c.cta, title: e.target.value } }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-gray-600">Subjudul</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={about.cta.subtitle || ""}
            onChange={(e) => setAbout((c) => ({ ...c, cta: { ...c.cta, subtitle: e.target.value } }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-gray-600">Teks Tombol Utama</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={about.cta.primaryText}
            onChange={(e) => setAbout((c) => ({ ...c, cta: { ...c.cta, primaryText: e.target.value } }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-gray-600">Link Tombol Utama</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={about.cta.primaryHref}
            onChange={(e) => setAbout((c) => ({ ...c, cta: { ...c.cta, primaryHref: e.target.value } }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-gray-600">Teks Tombol Kedua (opsional)</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={about.cta.secondaryText || ""}
            onChange={(e) => setAbout((c) => ({ ...c, cta: { ...c.cta, secondaryText: e.target.value } }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-gray-600">Link Tombol Kedua (opsional)</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={about.cta.secondaryHref || ""}
            onChange={(e) => setAbout((c) => ({ ...c, cta: { ...c.cta, secondaryHref: e.target.value } }))}
          />
        </label>
        {/* NEW: URL Gambar Kanan CTA */}
<label className="space-y-1 md:col-span-2">
  <span className="text-xs text-gray-600">URL Gambar Kanan (opsional)</span>
  <input
    type="url"
    inputMode="url"
    className="w-full rounded border px-3 py-2"
    placeholder="https://domain-kamu.com/cta-image.jpg"
    value={about.cta.image || ""}
    onChange={(e) =>
      setAbout((c) => ({ ...c, cta: { ...c.cta, image: e.target.value } }))
    }
  />
  <p className="text-xs text-gray-500">
    Rekomendasi: JPG/PNG/WEBP rasio ±16:9, min. 1200×700 px. Pastikan publik (HTTPS).
  </p>

  {about.cta.image ? (
    <div className="mt-2">
      <img
        src={about.cta.image}
        alt="Preview CTA"
        className="h-28 rounded border bg-white object-cover"
      />
    </div>
  ) : null}
</label>

      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Pengaturan — About</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["hero","stats","mission","values","timeline","team","cta"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-2 rounded border ${active === t ? "bg-black text-white" : "bg-white"}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {body}

      {/* Save bar */}
      <div className="pt-6">
        <button
          onClick={saveAll}
          disabled={saving}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan Semua"}
        </button>
      </div>
    </div>
  );
}

function TimelineRightMediaForm({
  pptUrl,
  caption,
  onChange,
}: {
  pptUrl: string;
  caption: string;
  onChange: (v: { pptUrl: string; caption: string }) => void;
}) {
  const office = pptUrl?.trim()
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pptUrl.trim())}`
    : "";

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
      <h3 className="font-medium">Perjalanan Singkat — Media Kanan</h3>

      <label className="block text-sm font-medium">URL PPTX (opsional)</label>
      <input
        type="url"
        inputMode="url"
        className="w-full rounded border px-3 py-2"
        placeholder="https://domain-kamu.com/folder/presentasi-kegiatan.pptx"
        value={pptUrl}
        onChange={(e) => onChange({ pptUrl: e.target.value, caption })}
      />
      <p className="text-xs text-gray-500">
        File .pptx publik (HTTPS). Ditampilkan via <code>view.officeapps.live.com</code>.
      </p>

      <label className="block text-sm font-medium">Caption (opsional)</label>
      <input
        type="text"
        className="w-full rounded border px-3 py-2"
        placeholder="Presentasi kegiatan (PPT)"
        value={caption}
        onChange={(e) => onChange({ pptUrl, caption: e.target.value })}
      />

      <div className="mt-3 rounded-xl border bg-slate-50">
        {!pptUrl?.trim() ? (
          <div className="h-[220px] grid place-items-center text-slate-400 text-sm">
            Masukkan URL PPT untuk melihat preview.
          </div>
        ) : (
          <iframe
            title="preview-ppt"
            src={office}
            className="w-full h-[320px] md:h-[420px] rounded-xl"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>
    </div>
  );
}

/** Sub-form untuk kartu Visi/Misi */
function MissionEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AboutInfoCard;
  onChange: (v: AboutInfoCard) => void;
}) {
  return (
    <div className="space-y-2 rounded border p-3 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{label}</h3>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.visible !== false}
            onChange={(e) => onChange({ ...value, visible: e.target.checked })}
          />
          Tampilkan
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-xs text-gray-600">Badge</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={value.badge}
            onChange={(e) => onChange({ ...value, badge: e.target.value })}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-gray-600">Ikon (opsional, mis. FiTarget)</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={value.icon || ""}
            onChange={(e) => onChange({ ...value, icon: e.target.value })}
          />
        </label>
      </div>

      <label className="space-y-1 block">
        <span className="text-xs text-gray-600">Judul</span>
        <input
          className="w-full rounded border px-3 py-2"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </label>

      <label className="space-y-1 block">
        <span className="text-xs text-gray-600">Deskripsi</span>
        <textarea
          className="w-full rounded border px-3 py-2 min-h-[90px]"
          value={value.desc}
          onChange={(e) => onChange({ ...value, desc: e.target.value })}
        />
      </label>
    </div>
  );
}
