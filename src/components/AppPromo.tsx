// src/components/AppPromo.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FiCheck } from "react-icons/fi";

type AppPromoContent = {
  visible?: boolean;
  image?: string | null;
  playUrl?: string;
  appUrl?: string;
  title?: string;
  subtitle?: string;
  downloadText?: string;
  bullets?: string[];
};

const DEFAULTS: AppPromoContent = {
  visible: true,
  image: null,
  playUrl: "https://play.google.com/store",
  appUrl: "https://www.apple.com/app-store/",
  title: "Berbuat baik setiap hari menjadi lebih mudah",
  subtitle:
    "Kelola donasi, ikuti perkembangan penyaluran bantuan, dan dapatkan notifikasi kegiatan terbaru langsung dari genggaman Anda.",
  downloadText: "Download aplikasi GRAHA KITA",
  bullets: [
    "Notifikasi real-time penyaluran & laporan",
    "Donasi aman, cepat, dan terdokumentasi",
    "Program pilihan yang kurasi & transparan",
  ],
};

export default function AppPromo() {
  const [cfg, setCfg] = useState<AppPromoContent>(DEFAULTS);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("site_content")
        .select("data")
        .eq("key", "app_promo")
        .maybeSingle();

      if (!alive) return;
      const d = (data?.data as AppPromoContent) ?? {};
      setCfg({
        ...DEFAULTS,
        ...d,
        bullets: (d.bullets && d.bullets.length ? d.bullets : DEFAULTS.bullets)!.slice(0, 5),
      });
    })();

    // live update (opsional)
    const ch = supabase
      .channel("site_content_app_promo")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "site_content", filter: "key=eq.app_promo" },
        (payload: any) => {
          const d = (payload?.new?.data || {}) as AppPromoContent;
          setCfg((prev) => ({
            ...prev,
            ...d,
            bullets: (d.bullets && d.bullets.length ? d.bullets : prev.bullets)!.slice(0, 5),
          }));
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, []);

  if (cfg.visible === false) return null;

  return (
    <section className="container-app py-10 sm:py-12">
      <div className="grid items-center gap-6 md:grid-cols-2">
        {/* Image left */}
        <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
          {cfg.image ? (
            <img src={cfg.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="aspect-[4/3]" />
          )}
        </div>

        {/* Text right */}
        <div>
          <h2 className="font-serif text-3xl font-extrabold leading-tight sm:text-4xl">
            {cfg.title}
          </h2>
          <p className="mt-3 text-slate-600">{cfg.subtitle}</p>

          {/* Download label + badges */}
          <div className="mt-6">
            <div className="text-sm font-semibold text-slate-700">{cfg.downloadText}</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={cfg.playUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block overflow-hidden rounded-xl ring-1 ring-slate-200"
              >
                <img
                  src="https://developer.android.com/static/images/brand/en_app_rgb_wo_45.png"
                  alt="Get it on Google Play"
                  className="h-12 w-auto"
                />
              </a>
              {cfg.appUrl && (
                <a
                  href={cfg.appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block overflow-hidden rounded-xl ring-1 ring-slate-200"
                >
                  <img
                    src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                    alt="Download on the App Store"
                    className="h-12 w-auto"
                  />
                </a>
              )}
            </div>
          </div>

          {/* Bullets */}
          {cfg.bullets && cfg.bullets.length > 0 && (
  <ul className="mt-6 space-y-2 text-slate-700">
    {cfg.bullets.map((t, i) => (
      <li key={i} className="flex items-start gap-2">
        <FiCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
          aria-hidden="true"
        />
        <span>{t}</span>
      </li>
    ))}
  </ul>
)}
        </div>
      </div>
    </section>
  );
}
