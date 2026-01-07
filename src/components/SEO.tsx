// src/components/SEO.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { resolveSeoFromPath, type ResolvedMeta } from "../lib/seoResolver";

/** ===== Types harus sama dengan yang dipakai di Admin ===== */
type AdminSeoSettings = {
  siteTitle?: string;
  siteDescription?: string;
  siteUrl?: string;               // ex: https://www.grahakita.id
  defaultOgImage?: string | null; // absolute/relative
  locale?: string;                // ex: id_ID
  themeColor?: string;            // ex: #0ea5e9
  social?: { twitter?: string; facebook?: string; instagram?: string };
};

type AdminSeoPage = {
  path: string;                   // "/", "/kontak", "/p/slug", "/campaign/*"
  title?: string | null;
  description?: string | null;
  image?: string | null;          // absolute/relative
  noindex?: boolean;
};

/** ====== Props komponen ====== */
export type SEOProps = {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  noindex?: boolean;

  ogType?: "website" | "article" | "profile" | string;
  twitterCard?: "summary" | "summary_large_image";
  appendSiteName?: boolean; // default: true
  jsonLd?: any | any[];     // optional LD+JSON
};

/** ===== Module cache agar fetch admin SEO sekali saja ===== */
let _cachedSeo: {
  settings: AdminSeoSettings | null;
  pages: AdminSeoPage[];
  loaded: boolean;
} = { settings: null, pages: [], loaded: false };

async function fetchSeoData() {
  const [s, p] = await Promise.all([
    supabase.from("site_content").select("data").eq("key", "seo_settings").maybeSingle(),
    supabase.from("site_content").select("data").eq("key", "seo_pages").maybeSingle(),
  ]);

  const settings = (s.data?.data as AdminSeoSettings) || null;
  const pages = ((p.data?.data as AdminSeoPage[]) || []).filter(Boolean);
  return { settings, pages };
}

function normalizePath(path: string) {
  if (!path) return "/";
  try {
    let x = path.split("?")[0].split("#")[0];
    if (x.length > 1 && x.endsWith("/")) x = x.slice(0, -1);
    if (!x.startsWith("/")) x = "/" + x;
    return x;
  } catch {
    return path;
  }
}

function ensureAbsolute(url?: string | null, siteUrl?: string) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (!siteUrl) return url || undefined;
  const base = siteUrl.replace(/\/+$/, "");
  const rel = (url || "").replace(/^\/+/, "");
  return `${base}/${rel}`;
}

function findPageOverride(pages: AdminSeoPage[], pathname: string): AdminSeoPage | null {
  const norm = normalizePath(pathname);
  const exact = pages.find((p) => normalizePath(p.path) === norm);
  if (exact) return exact;
  const wildcard = pages.find(
    (p) => p.path?.endsWith("*") && norm.startsWith(normalizePath(p.path.slice(0, -1)))
  );
  return wildcard || null;
}

/** Hook untuk load SEO admin (cache sekali) */
function useAdminSeo() {
  const [state, setState] = useState(() => ({
    settings: _cachedSeo.settings as AdminSeoSettings | null,
    pages: _cachedSeo.pages as AdminSeoPage[],
    loading: !_cachedSeo.loaded,
  }));

  useEffect(() => {
    let alive = true;
    if (_cachedSeo.loaded) return;
    (async () => {
      try {
        const { settings, pages } = await fetchSeoData();
        _cachedSeo = { settings, pages, loaded: true };
        if (!alive) return;
        setState({ settings, pages, loading: false });
      } catch {
        if (!alive) return;
        setState((s) => ({ ...s, loading: false }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

/** ===== Komponen utama ===== */
export default function SEO(props: SEOProps) {
  const {
    title,
    description,
    canonical,
    image,
    noindex,
    ogType = "website",
    twitterCard = "summary_large_image",
    appendSiteName = true,
    jsonLd,
  } = props;

  const { pathname, search } = useLocation();
  const { settings, pages } = useAdminSeo();

  // dynamic meta (Supabase) untuk halaman dinamis
  const [dyn, setDyn] = useState<ResolvedMeta | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const meta = await resolveSeoFromPath(pathname);
        if (!alive) return;
        setDyn(meta);
      } catch {
        if (!alive) return;
        setDyn(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pathname]);

  // default dari admin
  const globalTitle = settings?.siteTitle || "Graha Kita";
  const globalDesc =
    settings?.siteDescription ||
    "Bantu sebarkan Al-Qur’an dan salurkan bantuan kemanusiaan bersama Graha Kita.";
  const siteUrl = settings?.siteUrl || "";
  const defaultOg = settings?.defaultOgImage || undefined;

  // per-page override dari admin
  const pageOverride = useMemo(() => findPageOverride(pages || [], pathname), [pages, pathname]);

  // gabungan prioritas: props > override per-page > dynamic (Supabase) > global
  const finalTitleRaw =
    title ??
    pageOverride?.title ??
    dyn?.title ??
    globalTitle;

  const finalTitle =
    appendSiteName && finalTitleRaw && globalTitle && finalTitleRaw !== globalTitle
      ? `${finalTitleRaw} – ${globalTitle}`
      : finalTitleRaw || globalTitle;

  const finalDesc =
    description ??
    pageOverride?.description ??
    dyn?.description ??
    globalDesc;

  // ambil kandidat dari admin/per-page/dinamis/props
const candidateImage = image ?? pageOverride?.image ?? dyn?.image ?? (defaultOg || undefined);
let finalImageAbs = ensureAbsolute(candidateImage, siteUrl);

// fallback ke og generator bila kosong
if (!finalImageAbs) {
  // pakai judul & deskripsi yang sudah dihitung
  const titleForOg = (finalTitle || "").replace(/\s+/g, " ").trim();
  const subForOg = (finalDesc || "").replace(/\s+/g, " ").trim();

  const ogPath = `/.netlify/functions/og?title=${encodeURIComponent(titleForOg)}&subtitle=${encodeURIComponent(subForOg)}&brand=${encodeURIComponent(
    (settings?.siteUrl?.replace(/^https?:\/\//, "") || "grahakita.id")
  )}`;
  finalImageAbs = ensureAbsolute(ogPath, siteUrl);
}

  const finalCanonical = ((): string | undefined => {
    if (canonical) return canonical;
    if (!siteUrl) return undefined;
    const base = siteUrl.replace(/\/+$/, "");
    const path = normalizePath(pathname);
    const q = search || "";
    return `${base}${path}${q}`;
  })();

  const finalNoindex = !!(noindex || pageOverride?.noindex || dyn?.noindex || pathname.startsWith("/admin"));

  // Twitter @site
  const twSite = settings?.social?.twitter && settings.social.twitter.trim()
    ? settings.social.twitter.trim()
    : undefined;

  // JSON-LD: props punya prioritas, lalu dynamic dari resolver
  const finalJsonLd = jsonLd ?? dyn?.jsonLd;

  return (
    <Helmet prioritizeSeoTags>
      {/* TITLE */}
      {finalTitle ? <title>{finalTitle}</title> : null}

      {/* Description */}
      {finalDesc ? <meta name="description" content={finalDesc} /> : null}

      {/* Canonical */}
      {finalCanonical ? <link rel="canonical" href={finalCanonical} /> : null}

      {/* Robots */}
      <meta
        name="robots"
        content={finalNoindex ? "noindex,nofollow" : "index,follow"}
      />
      <meta
        name="googlebot"
        content={finalNoindex ? "noindex,nofollow" : "index,follow"}
      />

      {/* Theme Color */}
      {settings?.themeColor ? (
        <meta name="theme-color" content={settings.themeColor} />
      ) : null}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      {finalTitle ? <meta property="og:title" content={finalTitle} /> : null}
      {finalDesc ? <meta property="og:description" content={finalDesc} /> : null}
      {finalCanonical ? <meta property="og:url" content={finalCanonical} /> : null}
      {settings?.siteTitle ? (
        <meta property="og:site_name" content={settings.siteTitle} />
      ) : null}
      {settings?.locale ? (
        <meta property="og:locale" content={settings.locale} />
      ) : null}
      {finalImageAbs ? <meta property="og:image" content={finalImageAbs} /> : null}

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      {twSite ? <meta name="twitter:site" content={twSite} /> : null}
      {finalTitle ? <meta name="twitter:title" content={finalTitle} /> : null}
      {finalDesc ? <meta name="twitter:description" content={finalDesc} /> : null}
      {finalImageAbs ? <meta name="twitter:image" content={finalImageAbs} /> : null}

      {/* Optional JSON-LD */}
      {Array.isArray(finalJsonLd)
        ? finalJsonLd.map((obj, i) => (
            <script
              key={i}
              type="application/ld+json"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
            />
          ))
        : finalJsonLd
        ? (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(finalJsonLd) }}
          />
        )
        : null}
    </Helmet>
  );
}
