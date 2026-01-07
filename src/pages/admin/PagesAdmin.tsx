import { useEffect, useState } from 'react';
import { supabase } from "../../lib/supabase";
import { Eye, Pencil, Trash2, Link as LinkIcon, Plus, X } from 'lucide-react';

type Row = {
  id?: string;
  title: string;
  slug: string;
  content_md: string;
  image_url?: string | null;
  status: 'draft' | 'published';
  created_at?: string;
  updated_at?: string;
};

type PageOptions = {
  show_title: boolean;
  show_image: boolean;
};

type RowWithConf = Row & {
  sections_json?: string[] | null;
  options_json?: PageOptions | null;
};

function StatusPill({ status }: { status: Row['status'] }) {
  const cls =
    status === 'published'
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full uppercase ${cls}`}>
      {status}
    </span>
  );
}

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/\-+/g, '-')
    .slice(0, 80);
}

export default function PagesAdmin() {
  const [rows, setRows] = useState<RowWithConf[]>([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<RowWithConf | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // toggle sections (default on)
  const [useHeader, setUseHeader] = useState(true);
  const [useWidgets, setUseWidgets] = useState(false);
  const [useFooter, setUseFooter] = useState(true);

  // options: show/hide title & image (default show)
  const [showTitle, setShowTitle] = useState(true);
  const [showImage, setShowImage] = useState(true);

  // kunci scroll body ketika modal terbuka + ESC untuk tutup
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setModalOpen(false); setEditing(null); } };
    document.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onEsc);
    };
  }, [modalOpen]);

  async function load(keyword = '') {
    let req = supabase
      .from('pages')
      .select('id, title, slug, status, image_url, content_md, created_at, updated_at, sections_json, options_json')
      .order('updated_at', { ascending: false });

    if (keyword.trim()) {
      req = req.or(`title.ilike.%${keyword}%,slug.ilike.%${keyword}%`);
    }

    const { data, error } = await req;
    if (error) {
      alert('Gagal memuat: ' + error.message);
      return;
    }
    setRows((data ?? []) as RowWithConf[]);
  }

  useEffect(() => { load(); }, []);

  function startNew() {
    setEditing({
      title: '',
      slug: '',
      content_md: '',
      image_url: '',
      status: 'draft',
      sections_json: ['header', 'content', 'footer'],
      options_json: { show_title: true, show_image: true }
    });
    setUseHeader(true);
    setUseWidgets(false);
    setUseFooter(true);
    setShowTitle(true);
    setShowImage(true);
    setModalOpen(true);
  }

  async function save(nextStatus: 'published' | 'draft' = 'published') {
    if (!editing) return;
    if (!editing.title.trim()) { alert('Judul wajib diisi'); return; }

    const slug = (editing.slug || slugify(editing.title)).trim();
    if (!slug) { alert('Slug tidak valid'); return; }

    // rakit sections berdasarkan toggle
    const secs = ['content'];
    if (useHeader) secs.unshift('header');
    if (useWidgets) secs.push('widgets');
    if (useFooter) secs.push('footer');

    const options: PageOptions = { show_title: showTitle, show_image: showImage };

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload: Partial<RowWithConf> & { created_by?: string } = {
        title: editing.title,
        slug,
        content_md: editing.content_md,
        image_url: editing.image_url ? editing.image_url : null,
        status: nextStatus,
        sections_json: secs,
        options_json: options,
        ...(editing.id ? {} : { created_by: user?.id as string | undefined }),
      };

      if (editing.id) {
        const { error } = await supabase.from('pages').update(payload).eq('id', editing.id);
        if (error) { alert('Gagal menyimpan: ' + error.message); return; }
      } else {
        const { error } = await supabase.from('pages').insert(payload);
        if (error) { alert('Gagal membuat: ' + error.message); return; }
      }

      setModalOpen(false);
      setEditing(null);
      await load(q);
      alert('Tersimpan ✅');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: 'draft' | 'published') {
    const { error } = await supabase.from('pages').update({ status }).eq('id', id);
    if (error) { alert('Gagal ubah status: ' + error.message); return; }
    await load(q);
  }

  async function remove(id: string) {
    if (!confirm('Hapus halaman ini?')) return;
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (error) { alert('Gagal menghapus: ' + error.message); return; }
    await load(q);
  }

  function formatDt(s?: string) {
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleString();
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Halaman</h1>

        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(e.currentTarget.value)}
            placeholder="Cari judul / slug…"
            className="h-10 w-72 border rounded-xl px-3"
          />
          <button onClick={() => load(q)} className="h-10 px-3 rounded-xl border">
            Cari
          </button>
          <button
            onClick={startNew}
            className="h-10 px-4 rounded-2xl bg-black text-white flex items-center gap-2 shadow"
          >
            <Plus size={16} /> Halaman Baru
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3 mb-10">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border p-4 flex items-center gap-4">
            <img
              src={r.image_url || 'https://dummyimage.com/96x96/f3f4f6/9ca3af&text=–'}
              alt=""
              className="w-16 h-16 rounded-xl object-cover bg-gray-50"
              loading="lazy"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{r.title}</h3>
                <StatusPill status={r.status} />
              </div>
              <div className="text-xs text-gray-500">
                Diubah: {formatDt(r.updated_at)} • Slug: <code>{r.slug}</code>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditing(r);
                  const secs = (r.sections_json || []) as string[];
                  setUseHeader(secs.includes('header'));
                  setUseWidgets(secs.includes('widgets'));
                  setUseFooter(secs.includes('footer'));
                  const opt = r.options_json || { show_title: true, show_image: true };
                  setShowTitle(opt.show_title);
                  setShowImage(opt.show_image);
                  setModalOpen(true);
                }}
                title="Edit"
                className="h-9 w-9 grid place-items-center rounded-xl border hover:bg-gray-50"
              >
                <Pencil size={16} />
              </button>

              <a
                href={`/halaman/${r.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Lihat"
                className="h-9 w-9 grid place-items-center rounded-xl border hover:bg-gray-50"
              >
                <Eye size={16} />
              </a>

              <button
                onClick={() =>
                  navigator.clipboard.writeText(`${location.origin}/halaman/${r.slug}`)
                }
                title="Copy Link"
                className="h-9 w-9 grid place-items-center rounded-xl border hover:bg-gray-50"
              >
                <LinkIcon size={16} />
              </button>

              {r.status === 'published' ? (
                <button
                  onClick={() => setStatus(r.id!, 'draft')}
                  className="h-9 px-3 rounded-xl bg-amber-100 text-amber-800 text-sm"
                  title="Unpublish"
                >
                  Unpublish
                </button>
              ) : (
                <button
                  onClick={() => setStatus(r.id!, 'published')}
                  className="h-9 px-3 rounded-xl bg-green-100 text-green-700 text-sm"
                  title="Publish"
                >
                  Publish
                </button>
              )}

              <button
                onClick={() => remove(r.id!)}
                title="Hapus"
                className="h-9 w-9 grid place-items-center rounded-xl border hover:bg-red-50 text-red-600 border-red-200"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="text-center text-gray-500 border rounded-2xl p-6">
            Belum ada halaman.
          </div>
        )}
      </div>

      {/* EDITOR MODAL (lebar + scroll + header/footer sticky) */}
      {modalOpen && editing && (
        <div className="fixed inset-0 z-50">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { setModalOpen(false); setEditing(null); }}
          />
          {/* panel */}
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-[min(1100px,100vw-2rem)] rounded-2xl bg-white shadow-2xl border relative">
              {/* header sticky */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-3 rounded-t-2xl">
                <h3 className="font-semibold">Editor Halaman</h3>
                <button
                  onClick={() => { setModalOpen(false); setEditing(null); }}
                  className="h-9 w-9 grid place-items-center rounded-xl hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* body scrollable */}
              <div className="max-h-[70vh] overflow-y-auto p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT */}
                  <div>
                    <label className="block text-sm font-medium">Judul</label>
                    <div className="flex gap-3 items-center">
                      <input
                        className="w-full border rounded-xl p-2 mb-2"
                        value={editing.title}
                        onChange={(e) => setEditing(v => ({ ...(v as RowWithConf), title: e.target.value }))}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm mb-3 select-none">
                      <input
                        type="checkbox"
                        checked={!showTitle}
                        onChange={(e) => setShowTitle(!e.target.checked)}
                      />
                      <span>Sembunyikan judul di PageView</span>
                    </label>

                    <label className="block text-sm font-medium">Slug</label>
                    <input
                      className="w-full border rounded-xl p-2 mb-3"
                      value={editing.slug}
                      onChange={(e) => setEditing(v => ({ ...(v as RowWithConf), slug: slugify(e.target.value) }))}
                    />

                    <label className="block text-sm font-medium">Gambar (URL)</label>
                    <input
                      className="w-full border rounded-xl p-2 mb-2"
                      placeholder="https://..."
                      value={editing.image_url ?? ''}
                      onChange={(e) => setEditing(v => ({ ...(v as RowWithConf), image_url: e.target.value }))}
                    />
                    <label className="flex items-center gap-2 text-sm mb-3 select-none">
                      <input
                        type="checkbox"
                        checked={!showImage}
                        onChange={(e) => setShowImage(!e.target.checked)}
                      />
                      <span>Sembunyikan gambar di PageView</span>
                    </label>

                    <label className="block text-sm font-medium">Konten (Markdown)</label>
                    <textarea
                      className="w-full h-64 md:h-[420px] border rounded-xl p-2 font-mono"
                      value={editing.content_md}
                      onChange={(e) => setEditing(v => ({ ...(v as RowWithConf), content_md: e.target.value }))}
                    />
                  </div>

                  {/* RIGHT: toggles section */}
                  <div>
                    <div className="text-sm font-semibold mb-2">Section yang ditampilkan</div>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between rounded-xl border p-3">
                        <span>Header</span>
                        <input
                          type="checkbox"
                          checked={useHeader}
                          onChange={(e) => setUseHeader(e.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-xl border p-3">
                        <span>Widgets (Sidebar)</span>
                        <input
                          type="checkbox"
                          checked={useWidgets}
                          onChange={(e) => setUseWidgets(e.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-xl border p-3">
                        <span>Footer</span>
                        <input
                          type="checkbox"
                          checked={useFooter}
                          onChange={(e) => setUseFooter(e.target.checked)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* footer sticky */}
              <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t bg-white px-5 py-3 rounded-b-2xl">
                <button
                  onClick={() => save('published')}
                  disabled={saving}
                  className={`h-10 px-4 rounded-2xl text-white ${saving ? 'bg-gray-400' : 'bg-black'}`}
                >
                  {saving ? 'Menyimpan…' : 'Simpan (Publish)'}
                </button>
                <button
                  onClick={() => save('draft')}
                  disabled={saving}
                  className="h-10 px-4 rounded-2xl bg-amber-100 text-amber-800"
                >
                  Simpan Draft
                </button>
                <button
                  onClick={() => { setModalOpen(false); setEditing(null); }}
                  className="h-10 px-4 rounded-2xl bg-gray-100"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
