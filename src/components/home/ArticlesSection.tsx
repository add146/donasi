// src/components/home/ArticlesSection.tsx
/**
 * ArticlesSection.tsx (uses ArticlesShowcase)
 * - Patuh toggle: site_content.key = "home" -> data.sections.articles.enabled
 * - Jika disabled => return null (tidak dirender di PublicHome)
 * - Jika enabled => fetch 10 artikel published terbaru
 */
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Post } from "../../types/article";
import { ArticlesShowcase, SectionSkeleton } from "../article-ui";

async function isArticlesEnabled(): Promise<boolean> {
  // default: true agar tetap tampil kalau row belum dibuat
  try {
    const { data } = await supabase
      .from("site_content")
      .select("data")
      .eq("key", "home")
      .maybeSingle();
    const enabled = data?.data?.sections?.articles?.enabled;
    // jika explicit false -> sembunyikan
    return enabled !== false;
  } catch {
    return true;
  }
}

export default function ArticlesSection() {
  const [enabled, setEnabled] = useState<boolean | null>(null); // null = belum tahu
  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 1) cek toggle sekali saat mount
  useEffect(() => {
    let alive = true;
    (async () => {
      const ok = await isArticlesEnabled();
      if (!alive) return;
      setEnabled(ok);
    })();
    return () => { alive = false; };
  }, []);

  // 2) kalau enabled, baru fetch artikelnya
  useEffect(() => {
    if (enabled !== true) return; // disabled atau belum tahu
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("id,title,slug,excerpt,cover_url,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10);
      if (!alive) return;
      if (!error) setRows((data as Post[]) || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [enabled]);

  // Belum tahu status -> jangan render apa-apa (hindari kedip)
  if (enabled === null) return null;

  // Explicit disabled → sembunyikan section
  if (enabled === false) return null;

  // Enabled + loading skeleton
  if (loading) return <SectionSkeleton />;

  // Tidak ada artikel → sembunyikan
  if (!rows.length) return null;

  return <ArticlesShowcase posts={rows} title="Artikel Terbaru" maxList={6} />;
}
