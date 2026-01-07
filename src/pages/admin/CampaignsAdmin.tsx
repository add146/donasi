// src/pages/admin/CampaignsAdmin.tsx
import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, Globe, EyeOff } from "lucide-react";
import { Modal } from "./_ui/Modal";
import { Confirm } from "./_ui/Confirm";
import { supabase } from "../../lib/supabase";

/* ================== Types ================== */
type Row = {
  id: string; // PK (atau alias dari uuid)
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  target_amount: number;
  raised_amount: number;
  updated_at: string;

  summary: string | null;
  content: string | null;
  hero_image_url: string | null;
  category: string | null;
  is_featured: boolean | null;
  is_urgent: boolean | null;
  published_at: string | null;
};

type HomeToggle = { sections?: { campaigns?: { enabled?: boolean } } };

/* ================== Helpers ================== */
const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const progressPct = (raised = 0, target = 0) =>
  Math.max(0, Math.min(100, target > 0 ? Math.round((raised / target) * 100) : 0));

/* ================== Component ================== */
export default function CampaignsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);

  // master toggle (show/hide on home)
  const [enabled, setEnabled] = useState<boolean>(true);
  const [savingToggle, setSavingToggle] = useState(false);

  /* -------- Load list -------- */
  const load = async () => {
    setLoading(true);

    const contentCols = [
      "summary",
      "content",
      "hero_image_url",
      "category",
      "is_featured",
      "is_urgent",
      "published_at",
    ].join(",");

    let sel =
      "id,title,slug,status,target_amount,raised_amount,updated_at," + contentCols;

    let res = await supabase
      .from("campaigns")
      .select(sel)
      .order("updated_at", { ascending: false })
      .limit(100);

    // fallback kalau PK bukan `id` tapi `uuid`
    if (res.error) {
      sel =
        "id:uuid,title,slug,status,target_amount,raised_amount,updated_at," +
        contentCols;
      res = await supabase
        .from("campaigns")
        .select(sel)
        .order("updated_at", { ascending: false })
        .limit(100);
    }

    if (res.error) {
      console.error("[campaigns.load]", res.error);
      setRows([]);
    } else {
      setRows((res.data ?? []) as any);
    }

    setLoading(false);
  };

  /* -------- Load master toggle -------- */
  const loadToggle = async () => {
    const { data, error } = await supabase
      .from("site_content")
      .select("data")
      .eq("key", "home")
      .maybeSingle();
    if (error) {
      console.warn("loadToggle error:", error.message);
      setEnabled(true); // default ON
      return;
    }
    const on = (data?.data as HomeToggle | undefined)?.sections?.campaigns?.enabled;
    setEnabled(on !== false); // default ON
  };

  useEffect(() => {
    load();
    loadToggle();

    // realtime
    const ch = supabase
      .channel("campaigns_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaigns" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  /* -------- Save master toggle -------- */
  async function saveToggle(next: boolean) {
    setSavingToggle(true);
    try {
      const { data } = await supabase
        .from("site_content")
        .select("id,data")
        .eq("key", "home")
        .maybeSingle();

      const existing = (data?.data || {}) as Record<string, any>;
      const merged = {
        ...existing,
        sections: {
          ...(existing.sections || {}),
          campaigns: { ...(existing.sections?.campaigns || {}), enabled: next },
        },
      };

      if (data?.id) {
        await supabase.from("site_content").update({ data: merged }).eq("id", data.id);
      } else {
        await supabase.from("site_content").insert({ key: "home", data: merged });
      }
      setEnabled(next);
    } catch (e) {
      console.error("saveToggle error:", e);
      alert("Gagal menyimpan toggle tampilan beranda.");
    } finally {
      setSavingToggle(false);
    }
  }

  /* -------- Filter client-side -------- */
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        (r.title || "").toLowerCase().includes(t) ||
        (r.slug || "").toLowerCase().includes(t) ||
        (r.summary || "").toLowerCase().includes(t)
    );
  }, [rows, q]);

  /* -------- Row actions -------- */
  async function togglePublish(r: Row) {
    const next = r.status === "published" ? "draft" : "published";
    const payload = {
      status: next,
      published_at: next === "published" ? new Date().toISOString() : null,
    };

    let { error } = await supabase.from("campaigns").update(payload).eq("id", r.id);
    if (error) {
      ({ error } = await supabase.from("campaigns").update(payload).eq("uuid", r.id));
    }
    if (error) {
      console.error("[campaigns.togglePublish]", error);
      alert("Gagal mengubah status.");
    } else {
      load();
    }
  }

  async function remove(row: Row) {
    let { error } = await supabase.from("campaigns").delete().eq("id", row.id);
    if (error) {
      ({ error } = await supabase.from("campaigns").delete().eq("uuid", row.id));
    }
    if (error) {
      console.error("[campaigns.remove]", error);
      alert("Gagal menghapus.");
    } else {
      load();
    }
  }

  /* ================== UI ================== */
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-slate-500">
            Kelola daftar campaign, status publikasi, dan tampilan beranda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Master toggle tampil di beranda */}
          <label className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">Tampilkan di Beranda</span>
            <button
              type="button"
              onClick={() => saveToggle(!enabled)}
              disabled={savingToggle}
              className={[
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
                enabled ? "bg-slate-900" : "bg-slate-300",
              ].join(" ")}
              title="Show/Hide section di beranda"
            >
              <span
                className={[
                  "pointer-events-none inline-block h-5 w-5 translate-y-0.5 transform rounded-full bg-white shadow ring-0 transition-transform",
                  enabled ? "translate-x-5" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
          </label>

          <button
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-white"
          >
            <Plus className="h-4 w-4" /> Campaign Baru
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari judul/slug…"
          className="w-72 rounded-xl border px-3 py-2"
        />
      </div>

      {/* List */}
      <div className="divide-y rounded-2xl border bg-white shadow-sm">
        {loading && <div className="p-6 text-slate-500">Memuat…</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-6 text-slate-500">Belum ada campaign.</div>
        )}

        {filtered.map((r) => {
          const cover = r.hero_image_url || "";
          const pct = progressPct(r.raised_amount, r.target_amount);

          return (
            <div
              key={r.id}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              {/* Thumbnail */}
              <div className="shrink-0">
                <div className="h-20 w-36 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                  {cover ? (
                    <img
                      src={cover}
                      alt={r.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate text-base font-semibold">
                    {r.title}
                  </div>
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs",
                      r.status === "published"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "draft"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-amber-100 text-amber-700",
                    ].join(" ")}
                  >
                    {r.status}
                  </span>
                  {r.is_urgent && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Mendesak
                    </span>
                  )}
                  {r.is_featured && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      Pilihan
                    </span>
                  )}
                </div>

                <div className="mt-0.5 text-xs text-slate-500">/{r.slug}</div>
                {r.summary && (
                  <div className="mt-1 line-clamp-2 text-sm text-slate-700">
                    {r.summary}
                  </div>
                )}

                {/* progress */}
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative h-2 w-48 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="absolute inset-y-0 left-0 rounded-r-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-600">
                    {rupiah(r.raised_amount)} / {rupiah(r.target_amount)} ({pct}
                    %)
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
                {/* Publish / Hide */}
                <button
                  onClick={() => togglePublish(r)}
                  className="rounded-lg px-2 py-1 text-xs hover:bg-slate-100"
                  title={r.status === "published" ? "Sembunyikan" : "Terbitkan"}
                >
                  {r.status === "published" ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                </button>

                {/* Edit */}
                <button
                  onClick={() => {
                    setEditing(r);
                    setOpenForm(true);
                  }}
                  className="rounded-lg px-2 py-1 text-xs hover:bg-slate-100"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => setConfirmDel(r)}
                  className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form */}
      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editing ? "Edit Campaign" : "Campaign Baru"}
        size="lg"
      >
        <CampaignForm
          initial={editing ?? undefined}
          onClose={() => setOpenForm(false)}
          onSaved={load}
        />
      </Modal>

      {/* Confirm delete */}
      <Confirm
        open={!!confirmDel}
        message={`Hapus campaign “${confirmDel?.title}”? Tindakan ini tidak bisa dibatalkan.`}
        onCancel={() => setConfirmDel(null)}
        onConfirm={() => {
          if (confirmDel) remove(confirmDel);
          setConfirmDel(null);
        }}
      />
    </section>
  );
}

/* ================== Form (tetap) ================== */
function CampaignForm({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [target, setTarget] = useState<number>(initial?.target_amount ?? 0);
  const [status, setStatus] = useState<Row["status"]>(initial?.status ?? "draft");

  const [hero, setHero] = useState<string>(initial?.hero_image_url ?? "");
  const [summary, setSummary] = useState<string>(initial?.summary ?? "");
  const [content, setContent] = useState<string>(initial?.content ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "");
  const [isFeatured, setIsFeatured] = useState<boolean>(!!initial?.is_featured);
  const [isUrgent, setIsUrgent] = useState<boolean>(!!initial?.is_urgent);

  const summaryCount = summary?.length ?? 0;

  function slugify(s: string) {
    return (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  async function save() {
    setSaving(true);
    const payload: any = {
      title,
      slug,
      target_amount: Number(target) || 0,
      status,
      summary: summary?.trim() || null,
      content: content || "",
      category: category || null,
      is_featured: !!isFeatured,
      is_urgent: !!isUrgent,
      hero_image_url: hero?.trim() || null,
    };

    if (status === "published" && !initial?.published_at) {
      payload.published_at = new Date().toISOString();
    }
    if (status !== "published") {
      payload.published_at = null;
    }

    let error;
    if (initial) {
      ({ error } = await supabase.from("campaigns").update(payload).eq("id", initial.id));
      if (error) {
        ({ error } = await supabase.from("campaigns").update(payload).eq("uuid", initial.id));
      }
    } else {
      ({ error } = await supabase.from("campaigns").insert(payload));
    }

    setSaving(false);
    if (error) {
      alert(error.message);
    } else {
      onSaved();
      onClose();
    }
  }

  return (
    <div className="2xl:grid 2xl:grid-cols-3 2xl:gap-6">
      {/* Left (Form) */}
      <div className="2xl:col-span-2 max-h-[65vh] space-y-6 overflow-y-auto pr-1">
        {/* Info utama */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <header className="mb-4">
            <h3 className="text-base font-semibold">Informasi Utama</h3>
            <p className="text-sm text-slate-500">Judul, slug, target, dan status publikasi.</p>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Judul">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Judul campaign"
              />
            </Field>

            <Field label="Slug">
              <div className="flex gap-2">
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="slug-campaign"
                />
                <button
                  type="button"
                  onClick={() => setSlug(slugify(title))}
                  className="shrink-0 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
                  title="Buat dari judul"
                >
                  Generate
                </button>
              </div>
            </Field>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Target (Rp)">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
                <input
                  inputMode="numeric"
                  type="number"
                  value={Number.isFinite(target) ? target : 0}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-full rounded-xl border pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="0"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Masukkan angka tanpa titik/koma.</p>
            </Field>

            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Row["status"])}
                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </Field>
          </div>
        </section>

        {/* Konten */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <header className="mb-4">
            <h3 className="text-base font-semibold">Konten</h3>
            <p className="text-sm text-slate-500">Ringkasan untuk kartu beranda & deskripsi lengkap.</p>
          </header>

          <Field label="Ringkasan">
            <div>
              <textarea
                value={summary ?? ""}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Teks ringkas ±1–2 kalimat"
              />
              <div className="mt-1 text-right text-xs text-slate-500">{summaryCount} karakter</div>
            </div>
          </Field>

          <div className="mt-4">
            <Field label="Deskripsi Lengkap">
              <textarea
                value={content ?? ""}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Tulis deskripsi program (boleh HTML sederhana)"
              />
            </Field>
          </div>
        </section>

        {/* Media */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <header className="mb-4">
            <h3 className="text-base font-semibold">Media & Penampilan</h3>
            <p className="text-sm text-slate-500">Gambar hero, kategori, dan penandaan.</p>
          </header>

          <Field label="Gambar Hero (URL)">
            <input
              value={hero}
              onChange={(e) => setHero(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            <p className="mt-1 text-xs text-slate-500">Gunakan URL publik (mis. Supabase Storage).</p>
          </Field>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Kategori">
              <select
                value={category ?? ""}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">(kosong)</option>
                <option value="mendesak">mendesak</option>
                <option value="umum">umum</option>
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tampilkan di Pilihan (Featured)">
                <label className="inline-flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="relative h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-slate-900">
                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                  </span>
                  <span className="text-sm text-slate-700">Jadikan campaign pilihan</span>
                </label>
              </Field>

              <Field label="Tandai Mendesak (Urgent)">
                <label className="inline-flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="relative h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-amber-500">
                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                  </span>
                  <span className="text-sm text-slate-700">Tampilkan badge “Mendesak”</span>
                </label>
              </Field>
            </div>
          </div>
        </section>

        {/* Preview mobile (<2xl) */}
        <section className="mt-2 block 2xl:hidden">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-3 h-40 w-full overflow-hidden rounded-xl bg-slate-100">
              {hero ? (
                <img src={hero} alt="Hero preview" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-slate-400">Preview Gambar</div>
              )}
            </div>

            {isUrgent && (
              <span className="mb-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Mendesak
              </span>
            )}
            <h4 className="font-semibold">{title || "Judul Campaign"}</h4>
            <p className="mt-1 line-clamp-3 text-sm text-slate-600">
              {summary || "Ringkasan singkat campaign akan tampil di sini."}
            </p>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-500">{category || "kategori"}</span>
              <span className="font-medium">
                Target: {rupiah(target || 0)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Right preview (≥2xl) */}
      <aside className="hidden 2xl:block space-y-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 h-40 w-full overflow-hidden rounded-xl bg-slate-100">
            {hero ? (
              <img src={hero} alt="Hero preview" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-slate-400">Preview Gambar</div>
            )}
          </div>

          {isUrgent && (
            <span className="mb-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              Mendesak
            </span>
          )}
          <h4 className="font-semibold">{title || "Judul Campaign"}</h4>
          <p className="mt-1 line-clamp-3 text-sm text-slate-600">
            {summary || "Ringkasan singkat campaign akan tampil di sini."}
          </p>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-slate-500">{category || "kategori"}</span>
            <span className="font-medium">Target: {rupiah(target || 0)}</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Status</span>
            <span
              className={[
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                status === "published"
                  ? "bg-emerald-100 text-emerald-700"
                  : status === "draft"
                    ? "bg-slate-100 text-slate-700"
                    : "bg-amber-100 text-amber-700",
              ].join(" ")}
            >
              {status}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Featured: {isFeatured ? "Ya" : "Tidak"} • Urgent: {isUrgent ? "Ya" : "Tidak"}
          </div>
        </div>
      </aside>

      {/* Footer actions */}
      <div className="col-span-full mt-6 flex justify-end gap-2 border-t pt-4">
        <button onClick={onClose} className="rounded-xl px-4 py-2 hover:bg-slate-100">
          Batal
        </button>
        <button
          onClick={save}
          disabled={saving || !title || !slug}
          className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-slate-600">{label}</div>
      {children}
    </label>
  );
}
