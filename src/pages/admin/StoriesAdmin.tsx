// src/pages/admin/StoriesAdmin.tsx
import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiSearch } from "react-icons/fi";
import { supabase } from "../../lib/supabase";

type Story = {
  id?: string;
  name: string;
  quote: string;
  avatar: string; // url
  status: "draft" | "published" | "archived";
  sort_order: number;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

const EMPTY: Story = {
  name: "",
  quote: "",
  avatar: "",
  status: "draft",
  sort_order: 0,
  published_at: null,
};

export default function StoriesAdmin() {
  const [items, setItems] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Story>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  // --- Toggle tampil di beranda (default true kalau belum ada seting)
  const [enabled, setEnabled] = useState<boolean | null>(null);

  async function loadToggle() {
    const { data } = await supabase
      .from("site_content")
      .select("id,data")
      .eq("key", "home")
      .maybeSingle();
    const on = data?.data?.sections?.stories?.enabled;
    setEnabled(on !== false);
  }

  async function saveToggle(next: boolean) {
    setEnabled(next);
    const { data } = await supabase
      .from("site_content")
      .select("id,data")
      .eq("key", "home")
      .maybeSingle();

    const base = data?.data ?? {};
    const merged = {
      ...base,
      sections: {
        ...(base.sections ?? {}),
        stories: {
          ...(base.sections?.stories ?? {}),
          enabled: next,
        },
      },
    };

    if (data?.id) {
      await supabase.from("site_content").update({ data: merged }).eq("id", data.id);
    } else {
      await supabase.from("site_content").insert({ key: "home", data: merged });
    }
  }

  async function fetchRows() {
    setLoading(true);
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false, nullsFirst: true })
      .order("created_at", { ascending: false });
    if (!error) setItems((data || []) as Story[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchRows();
    loadToggle();

    // realtime ringan (opsional)
    const ch = supabase
      .channel("stories_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () =>
        fetchRows()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  function onNew() {
    setEdit({ ...EMPTY });
    setOpen(true);
  }
  function onEdit(it: Story) {
    setEdit({ ...it });
    setOpen(true);
  }
  async function onDelete(id?: string) {
    if (!id) return;
    if (!confirm("Hapus kisah ini?")) return;
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (!error) {
      setMsg("Kisah dihapus.");
      fetchRows();
    }
  }

  async function onSave() {
    setSaving(true);
    const payload: Story = { ...edit };

    // otomatis set/unset published_at
    if (payload.status === "published" && !payload.published_at) {
      payload.published_at = new Date().toISOString();
    }
    if (payload.status !== "published") {
      payload.published_at = null;
    }

    const { error } = await supabase.from("stories").upsert(payload, { onConflict: "id" });
    setSaving(false);
    if (error) {
      setMsg("Simpan gagal: " + error.message);
      return;
    }
    setOpen(false);
    setMsg("Kisah disimpan.");
    fetchRows();
  }

  async function uploadAvatar(file: File) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `stories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (error) {
      setMsg("Upload gagal: " + error.message);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setEdit((f) => ({ ...f, avatar: (data as any).publicUrl }));
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const k = q.toLowerCase();
    return items.filter(
      (x) => x.name.toLowerCase().includes(k) || x.quote.toLowerCase().includes(k)
    );
  }, [items, q]);

  return (
    <section title="Kisah Harapan" className="space-y-4">
      {msg && <div className="mb-2 rounded-lg bg-emerald-50 text-emerald-700 px-4 py-2">{msg}</div>}

      {/* Header + Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Kisah Harapan</h1>

        <div className="ml-auto flex items-center gap-3">
          {/* Toggle tampil di beranda */}
          <label className="inline-flex select-none items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-600"
              checked={enabled ?? true}
              onChange={(e) => saveToggle(e.target.checked)}
            />
            <span>Tampilkan di beranda</span>
          </label>

          <div className="relative w-64">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border-gray-300 pl-9"
              placeholder="Cari nama / kutipan..."
            />
          </div>

          <button
            className="btn-primary inline-flex items-center gap-2 rounded-lg px-3 py-2"
            onClick={onNew}
          >
            <FiPlus /> Kisah Baru
          </button>
        </div>
      </div>

      {/* LIST VERTIKAL (mirip Galeri Admin) */}
      <div className="divide-y rounded-2xl border bg-white shadow-sm">
        {loading && <div className="p-6 text-gray-400">Memuat…</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-6 text-gray-500">Belum ada kisah.</div>
        )}

        {filtered.map((it) => (
          <div key={it.id} className="flex items-start gap-4 p-4">
            <img
              src={it.avatar || "https://placehold.co/96x96?text=%20"}
              className="h-16 w-16 rounded-full object-cover ring-1 ring-gray-200"
              alt={it.name}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-semibold truncate max-w-[28rem]">{it.name}</div>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-xs " +
                    (it.status === "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : it.status === "draft"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-orange-100 text-orange-700")
                  }
                >
                  {it.status}
                </span>
                <span className="text-xs text-gray-500">Urutan: {it.sort_order}</span>
              </div>

              <div className="mt-1 line-clamp-2 text-sm text-gray-700">{it.quote}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="btn px-3 py-1.5 hover:bg-gray-100"
                title="Edit"
                onClick={() => onEdit(it)}
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
        ))}
      </div>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4 font-semibold">
              {edit.id ? "Edit Kisah" : "Kisah Baru"}
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Nama</label>
                <input
                  className="mt-1 w-full rounded-lg border-gray-300"
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Avatar (URL)</label>
                <input
                  className="mt-1 w-full rounded-lg border-gray-300"
                  value={edit.avatar}
                  onChange={(e) => setEdit({ ...edit, avatar: e.target.value })}
                />
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-brand-primary">
                  <FiUpload /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadAvatar(file);
                    }}
                  />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium">Kutipan</label>
                <textarea
                  className="mt-1 w-full rounded-lg border-gray-300"
                  rows={4}
                  value={edit.quote}
                  onChange={(e) => setEdit({ ...edit, quote: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="mt-1 w-full rounded-lg border-gray-300"
                  value={edit.status}
                  onChange={(e) =>
                    setEdit({ ...edit, status: e.target.value as Story["status"] })
                  }
                >
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Urutan (angka kecil tampil duluan)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border-gray-300"
                  value={edit.sort_order}
                  onChange={(e) =>
                    setEdit({ ...edit, sort_order: Number(e.target.value || 0) })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t p-4">
              <button className="btn px-4 py-2 hover:bg-gray-100" onClick={() => setOpen(false)}>
                Batal
              </button>
              <button
                className="btn-primary rounded-lg px-4 py-2 disabled:opacity-60"
                disabled={saving || !edit.name || !edit.quote}
                onClick={onSave}
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* Tailwind helpers (referensi)
.btn { @apply inline-flex items-center justify-center border border-gray-300 rounded-lg; }
.btn-primary { @apply bg-emerald-600 text-white hover:bg-emerald-700; }
*/
