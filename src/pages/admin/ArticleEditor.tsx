/**
 * src/pages/admin/ArticleEditor.tsx — PREMIUM EDITOR (Auto Slug + Upload + Resilient)
 * -----------------------------------------------------------------------------------
 * ✅ Auto Slug (default ON): slug mengikuti judul real-time. Jika kamu mengetik di field slug,
 *    mode auto otomatis OFF. Tombol "Gunakan dari judul" untuk mengaktifkan lagi.
 * ✅ Upload cover ke Supabase Storage bucket `publicimages/articles/...`
 * ✅ Insert/Update resilient: coba `content_html`; fallback ke `content` jika DB meminta.
 * ✅ Sticky Action Bar + Live Preview (kanan) + layout card premium (Tailwind).
 */

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type { Post, PostStatus } from "../../types/article";

type Form = Pick<Post, "title"|"slug"|"excerpt"|"cover_url"|"content_html"|"status">;

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Ubah plain text (dengan newline) ke HTML paragraf sederhana.
// - Jika sudah HTML, biarkan apa adanya.
function normalizeContentHtml(input: string) {
  const s = (input || "").trim();
  if (!s) return "";

  // Sudah ada tag HTML umum? anggap sudah HTML
  if (/<\s*(p|br|h[1-6]|ul|ol|li|img|blockquote|pre|div|section|article)\b/i.test(s)) {
    return s;
  }

  // Split paragraf per 2+ newline; single newline -> <br/>
  const blocks = s
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map(block => `<p>${block.replace(/\n/g, "<br/>")}</p>`);

  return blocks.join("\n");
}

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const nav = useNavigate();

  const [form, setForm] = useState<Form>({
    title: "",
    slug: "",
    excerpt: "",
    cover_url: "",
    content_html: "",
    status: "draft",
  });

  // --- UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slugAuto, setSlugAuto] = useState(true); // <— NEW: auto follow title
  const fileRef = useRef<HTMLInputElement | null>(null);

  // LOAD saat edit
  useEffect(() => {
    (async () => {
      if (isNew) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) alert(error.message);
      if (data) {
        setForm({
          title: (data as any).title ?? "",
          slug: (data as any).slug ?? "",
          excerpt: (data as any).excerpt ?? "",
          cover_url: (data as any).cover_url ?? "",
          content_html: (data as any).content_html ?? (data as any).content ?? "",
          status: (data as any).status ?? "draft",
        });
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  // Handlers
  function onChange<K extends keyof Form>(key: K, val: Form[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function onChangeTitle(v: string) {
    onChange("title", v);
    if (slugAuto) onChange("slug", slugify(v));
  }

  function onChangeSlug(v: string) {
    setSlugAuto(false);                  // user mulai mengedit slug -> auto OFF
    onChange("slug", slugify(v));
  }

  function enableAutoSlug() {
    setSlugAuto(true);
    onChange("slug", slugify(form.title));
  }

  // Nilai slug yang akan disimpan dan dipreview
  const computedSlug = useMemo(
    () => slugAuto ? slugify(form.title) : slugify(form.slug || form.title),
    [slugAuto, form.slug, form.title]
  );

  async function ensureUniqueSlug(slug: string, currentId?: string) {
    const { data, error } = await supabase
      .from("articles").select("id").eq("slug", slug);
    if (error) throw new Error(error.message);
    const taken = (data ?? []).some(r => r.id !== currentId);
    if (taken) throw new Error("Slug sudah dipakai. Gunakan slug lain.");
  }

  // --- Resilient insert/update helpers ---
  const errHas = (msg: string | undefined, a: string, b?: string) =>
    (msg || "").toLowerCase().includes(a.toLowerCase()) &&
    (b ? (msg || "").toLowerCase().includes(b.toLowerCase()) : true);

  async function insertResilient(payload: Record<string, any>) {
    let { data, error } = await supabase.from("articles").insert(payload).select("id").single();

    // Kolom content_html belum ada
    if (error && errHas(error.message, "content_html", "does not exist")) {
      const p2: any = { ...payload, content: payload.content_html ?? "" };
      delete p2.content_html;
      ({ data, error } = await supabase.from("articles").insert(p2).select("id").single());
    }

    // DB minta kolom content NOT NULL
    if (error && errHas(error.message, 'null value in column "content"', "not-null")) {
      const p3: any = { ...payload, content: payload.content_html ?? "" };
      ({ data, error } = await supabase.from("articles").insert(p3).select("id").single());
    }

    if (error) throw error;
    return data as { id: string };
  }

  async function updateResilient(rowId: string, payload: Record<string, any>) {
    let { error } = await supabase.from("articles").update(payload).eq("id", rowId);

    if (error && errHas(error.message, "content_html", "does not exist")) {
      const p2: any = { ...payload, content: payload.content_html ?? "" };
      delete p2.content_html;
      ({ error } = await supabase.from("articles").update(p2).eq("id", rowId));
    }

    if (error && errHas(error.message, 'null value in column "content"', "not-null")) {
      const p3: any = { ...payload, content: payload.content_html ?? "" };
      ({ error } = await supabase.from("articles").update(p3).eq("id", rowId));
    }

    if (error) throw error;
  }

  async function save(nextStatus?: PostStatus) {
    const status: PostStatus = nextStatus ?? form.status ?? "draft";
    const slug = computedSlug;
    const normalizedHtml = normalizeContentHtml(form.content_html || "");

    if (!form.title?.trim()) return alert("Title wajib diisi.");
    if (!slug) return alert("Slug tidak valid.");

    setSaving(true);
    try {
      await ensureUniqueSlug(slug, isNew ? undefined : id);

      if (isNew) {
        const payload = {
          title: form.title.trim(),
          slug,
          excerpt: (form.excerpt ?? "") || null,
          cover_url: (form.cover_url ?? "") || null,
          content_html: normalizedHtml,       // ← ganti ini
          status,
          published_at: status === "published" ? new Date().toISOString() : null,
        };
        const res = await insertResilient(payload);
        nav(`/admin/articles/${res.id}`, { replace: true });
        alert(status === "published" ? "Artikel dipublish." : "Draft disimpan.");
      } else {
        const { data: cur } = await supabase
          .from("articles").select("published_at,status").eq("id", id!).maybeSingle();
        const payload = {
          title: form.title.trim(),
          slug,
          excerpt: (form.excerpt ?? "") || null,
          cover_url: (form.cover_url ?? "") || null,
          content_html: normalizedHtml,       // ← ganti ini
          status,
          published_at: status === "published"
            ? ((cur as any)?.published_at ?? new Date().toISOString())
            : null,
          };
        await updateResilient(id!, payload);
        alert(status === "published" ? "Perubahan dipublish." : "Draft disimpan.");
      }
    } catch (e: any) {
      alert(e?.message || "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  const publish = async () => save("published");
  const saveDraft = async () => save("draft");

  // --- Upload cover ke Supabase Storage ---
  async function uploadCover(file: File) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const uid =
      (globalThis.crypto && "randomUUID" in globalThis.crypto)
        ? (globalThis.crypto as any).randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `articles/${uid}.${ext}`;
    const { error } = await supabase
      .storage.from("publicimages")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("publicimages").getPublicUrl(path);
    onChange("cover_url", (data as any).publicUrl);
  }

  async function onSelectFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadCover(file);
      // no alert needed; UI preview will berubah otomatis
    } catch (err: any) {
      alert(err?.message || "Gagal upload cover.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // --- UI ---
  if (loading) return <div className="p-6 text-gray-500">Memuat…</div>;

  return (
    <div className="min-h-[100dvh]">
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-slate-500">Artikel</div>
            <div className="truncate text-base font-semibold">{form.title || "Tulis Artikel"}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={saveDraft}
              disabled={saving}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
            >
              Simpan Draft
            </button>
            <button
              onClick={publish}
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Memproses…" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <label className="mb-1 block text-sm font-medium">Judul *</label>
            <input
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
              value={form.title}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder="Judul artikel"
            />
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium">Slug</label>
              <div className="flex items-center gap-2 text-xs">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${slugAuto ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {slugAuto ? "Auto ON" : "Auto OFF"}
                </span>
                {!slugAuto && (
                  <button
                    type="button"
                    onClick={enableAutoSlug}
                    className="rounded-lg border px-2 py-1 hover:bg-slate-50"
                  >
                    Gunakan dari judul
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring disabled:bg-slate-50"
                value={slugAuto ? slugify(form.title) : form.slug}
                onChange={(e) => onChangeSlug(e.target.value)}
                disabled={slugAuto}
                placeholder="otomatis dari judul (bisa dimatikan)"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Preview URL: <span className="font-mono">/p/{computedSlug}</span>
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <label className="mb-1 block text-sm font-medium">Cover</label>
            <div className="flex items-center gap-2">
              <input
                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                placeholder="https://..."
                value={form.cover_url || ""}
                onChange={(e) => onChange("cover_url", e.target.value)}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Upload akan tersimpan di <code>publicimages/articles/</code>. Link publik otomatis terisi.
            </p>
            {form.cover_url && (
              <div className="mt-3 overflow-hidden rounded-xl border">
                <img src={form.cover_url} alt="cover" className="max-h-64 w-full object-cover" />
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <label className="mb-1 block text-sm font-medium">Excerpt</label>
            <textarea
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
              rows={3}
              value={form.excerpt || ""}
              onChange={(e) => onChange("excerpt", e.target.value)}
              placeholder="Ringkasan singkat untuk SEO/preview"
            />
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <label className="mb-1 block text-sm font-medium">Isi (HTML)</label>
            <textarea
              className="h-72 w-full rounded-xl border px-3 py-2 font-mono outline-none focus:ring"
              value={form.content_html}
              onChange={(e) => onChange("content_html", e.target.value)}
              placeholder="<p>Konten HTML...</p>"
            />
          </div>
        </div>

        {/* Right: Live Preview */}
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 text-sm font-medium text-slate-600">Live Preview</div>
            {form.cover_url && (
              <img src={form.cover_url} alt="cover" className="mb-4 w-full rounded-xl object-cover" />
            )}
            <h1 className="mb-2 text-2xl font-semibold">{form.title || "Judul Artikel"}</h1>
            {form.excerpt && <p className="mb-4 text-slate-600">{form.excerpt}</p>}
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: normalizeContentHtml(
                  form.content_html || "<p><em>Konten akan tampil di sini…</em></p>"
              ),
            }}
            />
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">
              <div><span className="font-medium">Status:</span> {form.status}</div>
              <div><span className="font-medium">Slug:</span> <span className="font-mono">/p/{computedSlug}</span></div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={saveDraft} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">Simpan Draft</button>
              <button onClick={publish} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow hover:opacity-95">{saving ? "Memproses…" : "Publish"}</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
