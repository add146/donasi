import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ensurePublicUrl } from "../lib/uploadPublic";
import type { PartnersContent, PartnerLogo } from "../types/siteContent";
import { DEFAULT_PARTNERS } from "../types/siteContent";

/** Badge logo: tampilkan gambar jika ada, kalau tidak pakai fallback teks */
function LogoBadge({ name, image }: { name: string; image?: string | null }) {
  const img = ensurePublicUrl(image ?? undefined) ?? null;
  return (
    <div
      aria-label={name}
      className="group relative flex items-center justify-center h-14 rounded-xl border bg-white shadow-sm hover:shadow transition backdrop-blur-sm border-gray-200"
      title={name}
    >
      {img ? (
        <img src={img} alt={name} className="max-h-10 h-10 w-auto object-contain" />
      ) : (
        <svg
          viewBox="0 0 200 60"
          className="h-8 text-gray-400 group-hover:text-brand-primary transition"
          fill="currentColor"
          aria-hidden
        >
          <rect x="0" y="0" width="200" height="60" rx="10" fill="currentColor" opacity="0.08" />
          <text
            x="100"
            y="35"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto"
            fontSize="20"
            fill="currentColor"
            opacity="0.9"
          >
            {name}
          </text>
        </svg>
      )}
    </div>
  );
}

export default function PartnershipTeaser() {
  const [cfg, setCfg] = useState<PartnersContent>(DEFAULT_PARTNERS);

  useEffect(() => {
    // fetch sekali
    supabase
      .from("site_content")
      .select("data")
      .eq("key", "partners")
      .maybeSingle()
      .then((res) => {
        const d = (res.data?.data as PartnersContent) || null;
        if (d) setCfg({ ...DEFAULT_PARTNERS, ...d });
      });

    // realtime (opsional)
    const ch = supabase
      .channel("site_content_partners")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "site_content", filter: "key=eq.partners" },
        (p: any) => {
          const d = (p?.new?.data as PartnersContent) || {};
          setCfg({ ...DEFAULT_PARTNERS, ...d });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  // nonaktif → tidak dirender
  if (!cfg.enabled) return null;

  const activeLogos: PartnerLogo[] = (cfg.logos || []).filter((l) => l.isActive !== false);
  const deckHref = ensurePublicUrl(cfg.deckUrl ?? undefined) ?? "/files/Company-Deck-Kemitraan.pdf";

  return (
    <section id="partners" className="bg-gradient-to-b from-white to-[#fbfcff] py-14 sm:py-18">
      <div className="container-app">
        {/* Headline */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-brand-primary border-brand-primary/30 bg-brand-primary/5">
            Kemitraan & Sponsorship
          </span>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            Bertumbuh bersama mitra untuk dampak sosial yang{" "}
            <span className="text-brand-primary">lebih besar</span>.
          </h2>
          <p className="mt-3 text-gray-600">
            Perusahaan, yayasan, komunitas—semuanya bisa terlibat. Dukung program prioritas,
            adopsi kampanye, atau buat inisiatif sosial khusus bersama kami.
          </p>
        </div>

        {/* Logo cloud */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {activeLogos.map((l, i) => (
            <LogoBadge key={`${l.label}-${i}`} name={l.label} image={l.image} />
          ))}
        </div>

        {/* Paket singkat */}
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <TierCard tier="Silver"   price="Mulai 5jt/bulan"  features={["Branding di halaman kampanye", "Quarterly laporan dampak"]} />
          <TierCard tier="Gold"     highlight price="Mulai 20jt/bulan" features={["Branding premium di homepage", "Co-branding konten penyaluran", "Laporan bulanan & sesi review"]} />
          <TierCard tier="Platinum" price="Custom" features={["Program sosial bersama (tailor made)", "Liputan media & PR bersama", "Dashboard data & audit impact"]} />
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/kemitraan" className="btn-accent px-6 py-3 rounded-xl shadow hover:shadow-md transition">
            Ajukan Kemitraan
          </Link>
          <a href={deckHref} className="btn px-6 py-3 rounded-xl border hover:bg-gray-50" download>
            Unduh Deck (PDF)
          </a>
        </div>
      </div>
    </section>
  );
}

function TierCard({
  tier,
  price,
  features,
  highlight,
}: {
  tier: string;
  price: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border bg-white p-6 shadow-sm transition",
        highlight ? "ring-2 ring-brand-primary/60 border-brand-primary/30" : "hover:shadow",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{tier}</h3>
        {highlight && (
          <span className="rounded-full bg-brand-primary/10 text-brand-primary text-xs px-2 py-1">
            Rekomendasi
          </span>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-600">{price}</div>
      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-primary/80" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
