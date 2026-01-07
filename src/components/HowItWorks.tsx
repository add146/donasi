// src/components/HowItWorks.tsx
import { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiHeart,
  FiCreditCard,
  FiCheckCircle,
  FiMail,
  FiShield,
} from "react-icons/fi";
import { supabase } from "../lib/supabase";

/** Bentuk data yang disimpan di table `site_content` (key: "howitworks")  */
type HIWItem = { title: string; description: string };
type HowItWorksContent = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  items?: HIWItem[]; // 4 item
  cta?: { label: string; href: string };
};

/** Default agar UI selalu punya nilai kalau DB belum ada / kosong */
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
        "Tim kami memverifikasi transaksi dan menyalurkan bantuan secara tepat sasaran bersama mitra tepercaya.",
    },
    {
      title: "Terima Laporan",
      description:
        "Anda menerima notifikasi & ringkasan penggunaan dana. Ikuti progres penyaluran dari dashboard dan email.",
    },
  ],
  cta: { label: "Mulai Donasi Sekarang", href: "#campaigns" },
};

function mergeConfig(
  incoming?: HowItWorksContent | null
): HowItWorksContent {
  // pastikan base punya tipe yang benar, bukan {}
  const base = (incoming ?? {}) as Partial<HowItWorksContent>;

  const items =
    (base.items && base.items.length
      ? [...base.items, ...DEFAULTS.items!]
      : DEFAULTS.items!
    ).slice(0, 4);

  return {
    ...DEFAULTS,
    ...base,
    items,
    cta: {
      label: base.cta?.label ?? DEFAULTS.cta!.label,
      href: base.cta?.href ?? DEFAULTS.cta!.href,
    },
  };
}

function HighlightDuration({ text }: { text?: string }) {
  if (!text) return null;
  const re = /kurang dari 2 menit/i;
  const m = text.match(re);
  if (!m) return <>{text}</>;
  const [before, after] = text.split(m[0]);
  return (
    <>
      {before}
      <span className="font-semibold">{m[0]}</span>
      {after}
    </>
  );
}

export default function HowItWorks() {
  const [cfg, setCfg] = useState<HowItWorksContent>(DEFAULTS);

  // Ambil dari DB + realtime patuh admin
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("data")
          .eq("key", "howitworks")
          .maybeSingle();

        if (!mounted) return;
        if (error) throw error;

        const merged = mergeConfig((data?.data as HowItWorksContent) ?? null);
        setCfg(merged);
      } catch {
        if (!mounted) return;
        setCfg(DEFAULTS);
      }
    })();

    const ch = supabase
      .channel("site_content:howitworks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_content",
          filter: "key=eq.howitworks",
        },
        (payload: any) => {
          const merged = mergeConfig(payload?.new?.data as HowItWorksContent);
          setCfg(merged);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  // disembunyikan dari admin → jangan render
  if (cfg.visible === false) return null;

  // map item → icon (urutan tetap biar UI sama)
  const icons = useMemo(
    () => [FiSearch, FiCreditCard, FiCheckCircle, FiMail],
    []
  );

  const steps = (cfg.items ?? DEFAULTS.items!).map((it, i) => ({
    icon: icons[i] ? icons[i] : FiSearch,
    title: it.title,
    desc: it.description,
  }));

  return (
    <section id="how-it-works" className="relative py-16 sm:py-20">
      {/* Background premium */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-slate-50 to-white"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.25]"
        style={{
          backgroundImage:
            "radial-gradient(24rem 24rem at 20% -10%, rgba(250,204,21,.25), transparent 60%), radial-gradient(28rem 28rem at 90% 10%, rgba(16,185,129,.15), transparent 60%)",
        }}
      />

      <div className="container-app">
        {/* Header */}
        <header className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/60 px-3 py-1 text-[11px] font-medium text-amber-700">
            <FiHeart className="h-4 w-4" />
            Donasi Anda bermakna
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-serif font-bold tracking-tight">
            {cfg.title}
          </h2>
          <p className="mt-3 text-slate-600">
            <HighlightDuration text={cfg.subtitle} />
          </p>
        </header>

        {/* Steps */}
        <ol className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon as any;
            return (
              <li
                key={`${s.title}-${i}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-5 sm:p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {/* Number badge */}
                <div className="absolute -top-4 -left-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg ring-8 ring-amber-100/30">
                    <span className="text-sm font-bold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* Icon */}
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                {/* Title & desc */}
                <h3 className="text-lg font-semibold tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {s.desc}
                </p>

                {/* Hover highlight */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(40rem 14rem at 20% -10%, rgba(250,204,21,.08), transparent 60%)",
                  }}
                />
              </li>
            );
          })}
        </ol>

        {/* Trust bar */}
        <div className="mt-10 grid items-center justify-center gap-4 sm:grid-cols-3">
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <FiShield className="h-5 w-5 text-emerald-600" />
            <span className="text-sm">Pembayaran terenkripsi &amp; diaudit</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <FiCheckCircle className="h-5 w-5 text-emerald-600" />
            <span className="text-sm">Campaign terverifikasi</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <FiMail className="h-5 w-5 text-emerald-600" />
            <span className="text-sm">Laporan penyaluran transparan</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <a
            href={cfg.cta?.href ?? DEFAULTS.cta!.href}
            className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-amber-300 transition hover:bg-amber-500 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
          >
            {cfg.cta?.label ?? DEFAULTS.cta!.label}
          </a>
        </div>
      </div>
    </section>
  );
}
