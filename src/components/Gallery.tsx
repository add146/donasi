import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { FiChevronLeft, FiChevronRight, FiArrowRight } from "react-icons/fi";

type GalleryRow = {
  id: string;
  title: string;
  place: string | null;
  image_url: string | null;   // cover lama (fallback)
  images: string[] | null;    // array gambar
  cta_url: string | null;     // NEW: URL CTA
  sort_order: number | null;
  created_at: string;
  // status mungkin ada, tapi tidak wajib di type ini
};

function trim(s: string, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

const isHttp = (v?: string) => !!v && /^https?:\/\//i.test(v);
const toPublic = (v?: string) => {
  if (!v) return "";
  if (isHttp(v)) return v;
  const { data } = supabase.storage.from("publicimages").getPublicUrl(v);
  return data.publicUrl;
};
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function Gallery() {
  const [rows, setRows] = useState<GalleryRow[]>([]);
  const [current, setCurrent] = useState(0); // index kegiatan
  const [slide, setSlide] = useState(0);     // index gambar di kegiatan
  const [loading, setLoading] = useState(true);

  const [enabled, setEnabled] = useState(true);

useEffect(() => {
  (async () => {
    const { data } = await supabase
      .from("site_content")
      .select("data")
      .eq("key", "home")
      .maybeSingle();
    const on = data?.data?.sections?.gallery?.enabled;
    setEnabled(on !== false); // default tampil
  })();
}, []);


  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("galleries")
        .select("id,title,place,image_url,images,cta_url,sort_order,created_at,status")
        // penting: legacy rows dengan status NULL tetap ikut
        .or("status.is.null,status.eq.published")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows(data ?? []);
      }
      setLoading(false);
    };

    load();

    // realtime (v2)
    const ch = supabase
      .channel("galleries_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "galleries" },
        () => load()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  // Bentuk data untuk UI: cover + array gambar publik
  const normalized = useMemo(() => {
    return rows.map((r) => {
      const arr = Array.isArray(r.images) ? r.images.filter(Boolean) : [];
      if (arr.length === 0 && r.image_url) arr.push(r.image_url); // fallback
      const images = arr.map(toPublic).filter(Boolean);
      const cover = images[0] || "";
      return {
        ...r,
        cover,
        images,
        src: cover, // kompatibilitas untuk thumbnail sidebar
      };
    });
  }, [rows]);

  // reset slide saat ganti kegiatan
  useEffect(() => setSlide(0), [current]);
  if (!enabled) return null;

  // State loading
  if (loading) {
    return (
      <section id="gallery" className="py-16">
        <div className="container-app">
          <header className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-serif font-bold">Galeri Penyaluran Bantuan</h2>
            <p className="mt-2 text-gray-600">
              Lihat momen-momen penyaluran bantuan di lapangan.
            </p>
          </header>
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
            <div className="card h-[460px] animate-pulse" />
            <div className="space-y-3">
              <div className="card h-24 animate-pulse" />
              <div className="card h-24 animate-pulse" />
              <div className="card h-24 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Jika kosong, tampilkan empty state (JANGAN return null)
  if (!normalized.length) {
    return (
      <section id="gallery" className="py-16">
        <div className="container-app">
          <header className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-serif font-bold">Galeri Penyaluran Bantuan</h2>
            <p className="mt-2 text-gray-600">
              Belum ada galeri yang ditampilkan saat ini.
            </p>
          </header>
        </div>
      </section>
    );
  }

  const safeIndex = Math.min(current, normalized.length - 1);
  const active = normalized[safeIndex];
  const imgs = active.images?.length ? active.images : [active.cover];
  const hasMulti = imgs.length > 1;
  const ctaHref = active.cta_url || "/#campaigns";

  return (
    <section id="gallery" className="py-16">
      <div className="container-app">
        <header className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-serif font-bold">Galeri Penyaluran Bantuan</h2>
          <p className="mt-2 text-gray-600">Lihat momen-momen penyaluran bantuan di lapangan.</p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
          {/* KIRI: gambar besar + overlay (judul, lokasi, badge tanggal, CTA) */}
          <figure className="relative overflow-hidden rounded-2xl border bg-white shadow">
            <img
              src={imgs[slide] || active.cover}
              alt={active.title}
              className="h-[460px] w-full object-cover"
            />

            {/* overlay gradient + content */}
            <figcaption className="absolute inset-x-0 bottom-0">
              <div className="pointer-events-none h-28 w-full bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                {/* Judul & Lokasi */}
                <h3 className="text-lg font-semibold leading-6">{active.title}</h3>
                {active.place && (
                  <p className="mt-1 text-sm leading-5 opacity-95">{active.place}</p>
                )}

                {/* Badge tanggal (kuning) + CTA kanan */}
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-amber-500 text-black font-semibold ring-1 ring-amber-300 px-2 py-0.5">
                      {fmtDate(active.created_at)}
                    </span>
                  </div>
                  <a
                    href={ctaHref}
                    className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black shadow ring-1 ring-amber-300 hover:bg-amber-400"
                  >
                    Donasi Sekarang <FiArrowRight />
                  </a>
                </div>
              </div>
            </figcaption>

            {/* nav slider & dots */}
            {hasMulti && (
              <>
                <button
                  className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 ring-1 ring-gray-200 hover:bg-white"
                  onClick={() => setSlide((i) => (i - 1 + imgs.length) % imgs.length)}
                  aria-label="Sebelumnya"
                >
                  <FiChevronLeft />
                </button>
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 ring-1 ring-gray-200 hover:bg-white"
                  onClick={() => setSlide((i) => (i + 1) % imgs.length)}
                  aria-label="Berikutnya"
                >
                  <FiChevronRight />
                </button>

                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
                  {imgs.map((_, i) => (
                    <button
                      key={i}
                      className={`h-2.5 w-2.5 rounded-full ring-1 ring-black/10 ${
                        i === slide ? "bg-white" : "bg-white/60"
                      }`}
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => setSlide(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </figure>

          {/* KANAN: thumbnails (list kegiatan) */}
          {/* KANAN: thumbnails (list kegiatan) */}
<aside>
  <div className="max-h-[460px] overflow-y-auto pr-1 space-y-3">
    {normalized.map((it, i) => {
      const isActive = i === safeIndex;
      return (
        <button
          key={it.id}
          onClick={() => setCurrent(i)}
          aria-selected={isActive}
          className={[
            "w-full rounded-xl border p-2.5 shadow-sm transition-colors",
            "flex items-center gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300",
            isActive
              ? "bg-amber-50 border-transparent"
              : "bg-white border-gray-200 hover:bg-gray-50",
          ].join(" ")}
        >
          <img
            src={it.cover || it.image_url || ""}
            alt={it.title}
            className="h-16 w-20 rounded-lg object-cover shrink-0"
          />
          <div className="min-w-0">
            {/* Judul dibuat lebih kontras */}
            <div className="text-sm font-semibold leading-5 text-black">
              {trim(it.title, 28)}
            </div>

            {/* Deskripsi/ lokasi juga hitam (lebih terbaca) */}
            <div className="mt-0.5 text-xs leading-5 text-black">
              {trim(it.place || "", 60)}
            </div>

            {/* Kalau mau tetap tampilkan tanggal, aktifkan baris ini dan set warna agak gelap */}
            <div className="mt-0.5 text-[11px] text-slate-800">{fmtDate(it.created_at)}</div>
          </div>
        </button>
      );
    })}
  </div>
</aside>

        </div>
      </div>
    </section>
  );
}
