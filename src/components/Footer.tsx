import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { FooterContent } from "../types/siteContent";

const FALLBACK: FooterContent = {
  siteName: "Asa Bersama",
  description:
    "Yayasan non-profit yang berdedikasi untuk menciptakan kesetaraan dan kemandirian bagi penyandang disabilitas di Indonesia.",
  skNumber: "AHU-12345.AH.01.04.Tahun 2024",
  links: [
    { label: "FAQ", href: "/#faq" },
    { label: "Transparansi Laporan", href: "/#transparansi" },
    { label: "Syarat & Ketentuan", href: "/#terms" },
    { label: "Kebijakan Privasi", href: "/#privacy" },
  ],
  contact: {
    address: "Jl. Harapan Raya No. 123, Jakarta Selatan, Indonesia",
    email: "info@asabersama.org",
    phone: "",
    whatsapp: "",
  },
  mapEmbedUrl: "",
  social: {},
};

export default function Footer() {
  const [d, setD] = useState<FooterContent>(FALLBACK);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("data")
      .eq("key", "footer")
      .maybeSingle()
      .then((res) => {
        if (res.data?.data) setD({ ...FALLBACK, ...res.data.data });
      });

    const ch = supabase
      .channel("site_content_footer")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "site_content", filter: "key=eq.footer" },
        (p: any) => setD({ ...FALLBACK, ...(p.new?.data || {}) })
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <footer className="relative bg-slate-900 text-slate-100 mt-20">
      <div className="container-app py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Kolom 1: brand + deskripsi + SK */}
          <div>
            <div className="text-2xl font-semibold">{d.siteName}</div>
            <p className="mt-3 text-slate-300 leading-7">{d.description}</p>
            {d.skNumber && (
              <p className="mt-3 text-sm text-slate-400">
                <span className="font-medium">SK Kemenkumham:</span> {d.skNumber}
              </p>
            )}

            {/* Sosial */}
            {d.social && Object.values(d.social).some(Boolean) && (
              <div className="mt-4 flex items-center gap-3">
                {d.social.instagram && (
                  <a href={d.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"
                     className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700">
                    <span className="text-lg">📷</span>
                  </a>
                )}
                {d.social.facebook && (
                  <a href={d.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"
                     className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700">
                    <span className="text-lg">📘</span>
                  </a>
                )}
                {d.social.youtube && (
                  <a href={d.social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube"
                     className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700">
                    <span className="text-lg">▶️</span>
                  </a>
                )}
                {d.social.tiktok && (
                  <a href={d.social.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok"
                     className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700">
                    <span className="text-lg">🎵</span>
                  </a>
                )}
                {d.social.whatsapp && (
                  <a href={d.social.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp"
                     className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700">
                    <span className="text-lg">🟢</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Kolom 2: tautan cepat + kontak */}
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <div className="font-medium mb-3">Tautan Cepat</div>
              <ul className="space-y-2">
                {(d.links || []).map((lnk, i) => (
                  <li key={i}>
                    <a href={lnk.href} className="text-slate-300 hover:text-white">{lnk.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-medium mb-3">Hubungi Kami</div>
              <div className="space-y-2 text-slate-300">
                {d.contact.address && <div>{d.contact.address}</div>}
                {d.contact.email && <div>Email: {d.contact.email}</div>}
                {d.contact.phone && <div>Telp: {d.contact.phone}</div>}
                {d.contact.whatsapp && <div>WA: {d.contact.whatsapp}</div>}
              </div>
            </div>
          </div>

          {/* Kolom 3: peta */}
          <div>
            <div className="font-medium mb-3">Lokasi</div>
            {d.mapEmbedUrl ? (
              <div className="rounded-lg overflow-hidden shadow border border-slate-800">
                <iframe
                  src={d.mapEmbedUrl}
                  className="w-full h-60"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="text-slate-400 text-sm">
                Belum ada peta. Tambahkan URL Embed di Pengaturan &rarr; Footer.
              </div>
            )}
          </div>
        </div>

        <hr className="border-slate-800 my-8" />
        <div className="text-sm text-slate-400">
          © {new Date().getFullYear()} Yayasan {d.siteName}. Dibuat dengan cinta untuk Indonesia.
        </div>
      </div>
      {/* --- Web Developer badge --- */}
<a
  href="https://wa.me/6285822072349"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Web Developer"
  className="group absolute bottom-4 right-4 z-10 overflow-hidden rounded-lg
             bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100
             shadow ring-1 ring-white/5 hover:bg-slate-700"
>
  <span className="relative z-10">Web Developer</span>

  {/* shine effect */}
  <span
    aria-hidden
    className="pointer-events-none absolute inset-0 -translate-x-full
               bg-gradient-to-r from-transparent via-white/30 to-transparent
               opacity-70 blur-sm"
    style={{ animation: "shine-move 2.2s linear infinite" }}
  />
</a>

{/* keyframes untuk shine */}
<style>
  {`
    @keyframes shine-move {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `}
</style>
    </footer>
  );
}
