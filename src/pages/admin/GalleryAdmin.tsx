import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiLink2 } from "react-icons/fi";
import { supabase } from "../../lib/supabase";

/* ====== Tipe tabel persis di DB ====== */
type Row = {
  id: string;
  title: string;
  place: string | null;
  description: string | null;       // masih ada di DB, tapi tidak diedit lagi
  image_url: string | null;         // cover lama (fallback)
  images: string[] | null;          // array gambar
  sort_order: number | null;
  status: "draft" | "published";
  created_at: string;
};

/* ====== Tipe untuk render list ====== */
type Item = {
  id: string;
  title: string;
  place: string;
  cover: string;       // sudah jadi public URL
  images: string[];    // untuk future (admin preview)
};

/* ====== Helpers ====== */
const isHttp = (v?: string) => !!v && /^https?:\/\//i.test(v);

const toPublicSrc = (image_url: string) => {
  if (!image_url) return "";
  if (isHttp(image_url)) return image_url;
  const { data } = supabase.storage.from("publicimages").getPublicUrl(image_url);
  return data.publicUrl;
};

const normalizeArray = (arr?: string[] | null) =>
  Array.isArray(arr) ? arr.filter(Boolean) : [];

/* ====== Komponen ====== */
export default function GalleryAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<Row> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // toggle “tampilkan galeri di public home”
  const [enabled, setEnabled] = useState<boolean>(true);
  const [savingToggle, setSavingToggle] = useState(false);

  // Transform DB row -> item list
  const items: Item[] = useMemo(
    () =>
      rows.map((r) => {
        const imgs = normalizeArray(r.images);
        const cover = imgs[0] || r.image_url || "";
        return {
          id: r.id,
          title: r.title,
          place: r.place ?? "",
          cover: toPublicSrc(cover),
          images: imgs.map(toPublicSrc),
        };
      }),
    [rows]
  );

  /* ====== Load data ====== */
  const load = async () => {
    const { data, error } = await supabase
      .from("galleries")
      .select("id,title,place,description,image_url,images,sort_order,status,created_at")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMsg(error.message);
      setRows([]);
    } else {
      setRows(data ?? []);
      setMsg(null);
    }
  };

  // baca toggle dari site_content (key: 'home' → data.sections.gallery.enabled)
  const loadToggle = async () => {
    const { data } = await supabase
      .from("site_content")
      .select("id,data")
      .eq("key", "home")
      .maybeSingle();

    const on = data?.data?.sections?.gallery?.enabled;
    setEnabled(on !== false); // default true
  };

  useEffect(() => {
    // muat data awal
    load();
    loadToggle();

    // Realtime optional, kompatibel v2 dan v1
    const client: any = supabase;
    let unsub: (() => void) | null = null;

    if (typeof client.channel === "function") {
      // v2
      const ch = client
        .channel("galleries_admin")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "galleries" },
          () => load()
        )
        .subscribe();

      unsub = () => client.removeChannel(ch);
    } else {
      // v1
      const ch = client
        .from("galleries")
        .on("*", () => load())
        .subscribe();

      unsub = () => client.removeSubscription(ch);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  /* ====== Simpan toggle ====== */
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
          gallery: { ...(current.sections?.gallery ?? {}), enabled: next },
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
      setMsg("Pengaturan galeri diperbarui.");
    } catch (e: any) {
      console.error(e);
      setMsg(e.message ?? "Gagal menyimpan pengaturan.");
    } finally {
      setSavingToggle(false);
    }
  }

  /* ====== Actions ====== */
  function onNew() {
    setEdit({
      id: undefined,
      title: "",
      place: "",
      images: ["", "", "", ""], // minimal 4 input
      image_url: "",
      sort_order: 0,
      status: "published",
    });
    setOpen(true);
  }

  function onEdit(row: Row | Item) {
    const r =
      "images" in (row as Row) && Array.isArray((row as Row).images)
        ? (row as Row)
        : rows.find((x) => x.id === (row as Item).id)!;

    const imgs = normalizeArray(r.images);
    setEdit({
      id: r.id,
      title: r.title,
      place: r.place ?? "",
      images: imgs.length >= 4 ? imgs : [...imgs, ...Array(4 - imgs.length).fill("")],
      image_url: r.image_url ?? "",
      sort_order: r.sort_order ?? 0,
      status: r.status,
    });
    setOpen(true);
  }

  async function onDelete(id: string) {
    if (!confirm("Hapus entri galeri ini?")) return;
    const { error } = await supabase.from("galleries").delete().eq("id", id);
    if (error) {
      setMsg(error.message);
      return;
    }
    await load();
    setMsg("Berhasil dihapus.");
  }

  // upload file -> path di bucket
  async function uploadToBucket(file: File) {
    const path = `gallery/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("publicimages")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return path; // simpan ke array images (bukan URL publik)
  }

  async function onSave() {
    if (!edit) return;

    // Validasi: judul + minimal 4 gambar terisi
    const imgs = normalizeArray(edit.images);
    const nonEmpty = imgs.filter(Boolean);
    if (!edit.title || nonEmpty.length < 4) {
      setMsg("Judul wajib diisi & minimal 4 gambar.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: edit.title!,
        place: (edit.place ?? "") || null,
        // description tidak lagi diedit—biarkan nilai lama di DB kalau ada.
        images: imgs,                                 // array path/URL
        image_url: imgs[0] || edit.image_url || null, // cover fallback
        sort_order: edit.sort_order ?? 0,
        status: (edit.status ?? "published") as Row["status"],
      };

      if (edit.id) {
        const { error } = await supabase
          .from("galleries")
          .update(payload)
          .eq("id", edit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("galleries").insert(payload);
        if (error) throw error;
      }
      setOpen(false);
      await load();
      setMsg("Tersimpan.");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ====== UI ====== */
  return (
    <section className="space-y-4">
      {/* banner pesan */}
      {msg && (
        <div className="mb-2 rounded-lg bg-emerald-50 text-emerald-700 px-4 py-2">
          {msg}
        </div>
      )}

      {/* Toggle tampil/sembunyi di public home */}
      <div className="rounded-2xl border bg-white shadow-sm p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">Tampilkan Galeri di Halaman Utama</div>
          <div className="text-sm text-gray-600">
            Jika dimatikan, section galeri tidak akan muncul di public home.
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
          {/* switch sederhana */}
          <span
            className={[
              "h-6 w-11 rounded-full transition-colors",
              enabled ? "bg-emerald-500" : "bg-gray-300",
            ].join(" ")}
          >
            <span
              className={[
                "block h-5 w-5 rounded-full bg-white translate-x-0.5 mt-0.5 transition-transform",
                enabled ? "translate-x-[22px]" : "translate-x-0",
              ].join(" ")}
            />
          </span>
          <span className="text-sm">{enabled ? "Tampil" : "Sembunyi"}</span>
        </label>
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Galeri</h1>
          <p className="text-sm text-gray-500">
            Setiap entri mewakili 1 kegiatan, berisi ≥4 gambar.
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={onNew}>
          <FiPlus /> Tambah Gambar
        </button>
      </header>

      {/* LIST VERTIKAL */}
      <div className="divide-y rounded-2xl border bg-white shadow-sm">
        {items.length === 0 && (
          <div className="p-6 text-gray-500">Belum ada galeri.</div>
        )}

        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-4 p-4">
            <img
              src={it.cover}
              alt={it.title}
              className="h-16 w-24 rounded object-cover ring-1 ring-gray-200"
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{it.title}</div>
              <div className="text-sm text-gray-600 truncate">{it.place}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn px-3 py-1.5 hover:bg-gray-100"
                title="Edit"
                onClick={() => onEdit(rows.find((r) => r.id === it.id)!)}
              >
                <FiEdit2 />
              </button>
              <button
                className="btn px-3 py-1.5 hover:bg-red-50 text-red-600"
                title="Hapus"
                onClick={() => onDelete(it.id)}
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL FORM */}
      {open && edit && (
        <div
          className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">
                {edit.id ? "Edit Galeri" : "Tambah Galeri"}
              </h3>
              <button className="btn px-3 py-2 hover:bg-gray-100" onClick={() => setOpen(false)}>
                Tutup
              </button>
            </div>

            {/* Body scrollable */}
            <div className="px-6 py-4 overflow-y-auto">
              <div className="grid gap-4">
                {/* Judul / Lokasi */}
                <Text
                  label="Judul"
                  value={edit.title ?? ""}
                  onChange={(v) => setEdit({ ...edit, title: v })}
                />
                <Text
                  label="Lokasi / Deskripsi singkat"
                  value={(edit.place as string) ?? ""}
                  onChange={(v) => setEdit({ ...edit, place: v })}
                />

                {/* Gambar (minimal 4) */}
                <div>
                  <div className="mb-2 text-sm font-medium">Gambar (minimal 4)</div>
                  <div className="space-y-2">
                    {(edit.images ?? []).map((val, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[auto,1fr,auto,auto,auto] items-center gap-2"
                      >
                        <span className="text-xs w-6 text-gray-500">{idx + 1}.</span>

                        <input
                          className="rounded-lg border-gray-300"
                          value={val ?? ""}
                          onChange={(e) => {
                            const arr = [...(edit.images ?? [])];
                            arr[idx] = e.target.value;
                            setEdit({ ...edit, images: arr });
                          }}
                          placeholder="https://... (URL) atau path di bucket"
                        />

                        {/* Upload */}
                        <label className="btn px-3 py-2 cursor-pointer" title="Upload">
                          <FiImage />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                setLoading(true);
                                const path = await uploadToBucket(file);
                                const arr = [...(edit.images ?? [])];
                                arr[idx] = path;
                                setEdit({ ...edit, images: arr });
                                setMsg("Upload berhasil.");
                              } catch (err: any) {
                                setMsg(err.message);
                              } finally {
                                setLoading(false);
                              }
                            }}
                          />
                        </label>

                        {/* Open */}
                        <button
                          className="btn px-3 py-2 hover:bg-gray-100"
                          title="Buka"
                          onClick={() => {
                            const link = toPublicSrc((edit.images ?? [])[idx] || "");
                            if (link) window.open(link, "_blank");
                          }}
                        >
                          <FiLink2 />
                        </button>

                        {/* Hapus baris */}
                        <button
                          className="btn px-3 py-2 hover:bg-red-50 text-red-600"
                          title="Hapus baris"
                          onClick={() => {
                            const arr = [...(edit.images ?? [])];
                            // jaga minimal 4 kolom
                            if (arr.length <= 4) {
                              arr[idx] = "";
                            } else {
                              arr.splice(idx, 1);
                            }
                            setEdit({ ...edit, images: arr });
                          }}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="btn px-3 py-2"
                      onClick={() =>
                        setEdit((p) => ({ ...p!, images: [...(p?.images ?? []), ""] }))
                      }
                    >
                      + Tambah Kolom Gambar
                    </button>
                    {(edit.images ?? []).length > 4 && (
                      <button
                        type="button"
                        className="btn px-3 py-2"
                        onClick={() =>
                          setEdit((p) => ({
                            ...p!,
                            images: (p?.images ?? []).slice(0, -1),
                          }))
                        }
                      >
                        − Hapus Kolom Terakhir
                      </button>
                    )}
                    <p className="text-xs text-gray-500">
                      Tempel URL langsung atau klik <b>Upload</b> untuk simpan ke bucket.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer sticky (tombol selalu terlihat) */}
            <div className="px-6 py-4 border-t bg-white sticky bottom-0">
              <div className="flex justify-end gap-2">
                <button className="btn px-4 py-2 hover:bg-gray-100" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button
                  className="btn-primary px-4 py-2"
                  onClick={onSave}
                  disabled={loading}
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ====== subcomponents ====== */
function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm">{label}</label>
      <input
        className="mt-1 w-full rounded-lg border-gray-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
