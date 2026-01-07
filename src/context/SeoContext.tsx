// src/context/SeoContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { SITE } from "../lib/seo";

export type SeoSettings = {
  siteTitle?: string;
  siteDescription?: string;
  siteUrl?: string;
  defaultOgImage?: string | null;
  locale?: string;
  themeColor?: string;
  social?: { twitter?: string; facebook?: string; instagram?: string };
};

export type SeoPage = {
  path: string;              // ex: "/", "/tentang-kami", "/p/slug", "/campaign/slug"
  title?: string | null;
  description?: string | null;
  image?: string | null;
  noindex?: boolean;
};

type Ctx = {
  settings: Required<SeoSettings>;
  pages: SeoPage[];
  refresh: () => Promise<void>;
  pageFor: (path: string) => SeoPage | undefined;
};

const SeoContext = createContext<Ctx | null>(null);

const DEFAULTS: Required<SeoSettings> = {
  siteTitle: SITE.name,
  siteDescription: SITE.description,
  siteUrl: SITE.siteUrl,
  defaultOgImage: SITE.defaultOgImage,
  locale: SITE.locale,
  themeColor: SITE.themeColor,
  social: { twitter: "", facebook: "", instagram: "" },
};

export function SeoProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Required<SeoSettings>>(DEFAULTS);
  const [pages, setPages] = useState<SeoPage[]>([]);

  const refresh = async () => {
    // Ambil global settings
    const { data: s } = await supabase
      .from("site_content")
      .select("data")
      .eq("key", "seo_settings")
      .maybeSingle();
    const sdata = (s?.data || {}) as SeoSettings;
    setSettings((prev) => ({ ...prev, ...sdata } as Required<SeoSettings>));

    // Ambil per-page overrides
    const { data: p } = await supabase
      .from("site_content")
      .select("data")
      .eq("key", "seo_pages")
      .maybeSingle();
    const parr = (p?.data || []) as SeoPage[];
    setPages(Array.isArray(parr) ? parr : []);
  };

  useEffect(() => {
    refresh(); // load saat mount
    // (opsional) bisa tambahkan realtime kalau perlu
  }, []);

  const pageFor = (path: string) => pages.find((x) => x.path === path);

  const value = useMemo<Ctx>(() => ({ settings, pages, refresh, pageFor }), [settings, pages]);

  return <SeoContext.Provider value={value}>{children}</SeoContext.Provider>;
}

export function useSeo() {
  const ctx = useContext(SeoContext);
  if (!ctx) throw new Error("useSeo must be used within <SeoProvider>");
  return ctx;
}
