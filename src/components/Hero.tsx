// src/sections/Hero.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ensurePublicUrl } from "../lib/uploadPublic";

type HeroContent = {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
  bgImage?: string | null;          // <—
};

const FALLBACK: HeroContent = {
  headline: "Kebaikan Anda, Kekuatan Mereka.",
  subheadline:
    "Setiap donasi yang Anda berikan membuka pintu harapan dan kesempatan bagi saudara kita penyandang disabilitas untuk hidup mandiri dan berdaya.",
  ctaText: "Bantu Mereka Sekarang",
  ctaHref: "#campaigns",
  bgImage: null,
};

function normalizeHero(raw: any | null | undefined): HeroContent {
  return {
    headline: raw?.headline ?? raw?.title ?? FALLBACK.headline,
    subheadline: raw?.subheadline ?? raw?.subtitle ?? FALLBACK.subheadline,
    ctaText: raw?.ctaText ?? FALLBACK.ctaText,
    ctaHref: raw?.ctaHref ?? raw?.ctaUrl ?? FALLBACK.ctaHref,
    // dukung beberapa nama field agar kompatibel
    bgImage: raw?.bgImage ?? raw?.backgroundUrl ?? null,
  };
}

export default function Hero() {
  const [d, setD] = useState<HeroContent>(FALLBACK);

  useEffect(() => {
    supabase.from("site_content")
      .select("data").eq("key", "hero").maybeSingle()
      .then((res) => setD(normalizeHero(res.data?.data)));

    const ch = supabase.channel("site_content_hero")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "site_content", filter: "key=eq.hero" },
        (payload: any) => setD(normalizeHero(payload.new?.data))
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  const href = d.ctaHref || "#campaigns";
  const bgUrl = ensurePublicUrl(d.bgImage || undefined) || null;
  const style = bgUrl
    ? { backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;

  return (
    <section id="hero" className={`relative ${bgUrl ? "" : "bg-hero"}`} style={style}>
      {bgUrl && <div className="absolute inset-0 bg-black/35" />} {/* overlay agar teks kontras */}
      <div className="relative container-app pt-20 md:pt-24 pb-28 md:pb-36">
        <span className="pointer-events-none select-none absolute left-5 md:left-10 top-6 md:top-8
                         text-[110px] md:text-[170px] font-serif font-extrabold text-white/20 leading-none">
          Harapan
        </span>

        <div className="relative max-w-4xl mx-auto text-white text-center">
          <h1 className="text-[46px] md:text-[76px] leading-[1.05] tracking-tight font-serif font-extrabold">
            {d.headline}
          </h1>
          <p className="mt-4 text-[17px] md:text-[18px] leading-8 text-white/90 max-w-3xl mx-auto">
            {d.subheadline}
          </p>
          <div className="mt-8">
            <a href={href} className="btn-accent px-9 md:px-10 py-4 rounded-full text-[16px] md:text-[17px] lift shadow-xl md:shadow-2xl">
              {d.ctaText}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
