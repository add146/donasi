// src/lib/seoResolver.ts
import { supabase } from "./supabase";

export type ResolvedMeta = {
  title?: string;
  description?: string;
  image?: string | null;
  noindex?: boolean;
  jsonLd?: any | any[];
};

function stripHtml(html?: string | null): string {
  if (!html) return "";
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function resolveCampaign(slug: string): Promise<ResolvedMeta | null> {
  // Coba ambil dari table "campaigns" (nama & kolom paling umum)
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select(
        `
        id,
        slug,
        title,
        name,
        summary,
        short_description,
        description,
        cover_image,
        hero_image,
        image,
        og_image,
        updated_at,
        published_at
      `
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;

    const title: string =
      data.title || data.name || "Campaign";
    const description: string =
      data.summary ||
      data.short_description ||
      stripHtml(data.description).slice(0, 160);
    const image: string | null =
      data.og_image || data.cover_image || data.hero_image || data.image || null;
    const date = data.published_at || data.updated_at || null;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      dateModified: date || undefined,
    };

    return { title, description, image, jsonLd };
  } catch {
    return null;
  }
}

async function resolveArticle(slug: string): Promise<ResolvedMeta | null> {
  // Coba ambil dari table "articles" (nama & kolom paling umum)
  try {
    const { data, error } = await supabase
      .from("articles")
      .select(
        `
        id,
        slug,
        title,
        headline,
        excerpt,
        summary,
        content,
        cover_image,
        image,
        banner,
        og_image,
        author,
        author_name,
        updated_at,
        published_at,
        created_at
      `
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;

    const title: string =
      data.title || data.headline || "Artikel";
    const description: string =
      data.excerpt || data.summary || stripHtml(data.content).slice(0, 160);
    const image: string | null =
      data.og_image || data.cover_image || data.image || data.banner || null;
    const datePublished = data.published_at || data.created_at || undefined;
    const dateModified = data.updated_at || data.published_at || undefined;
    const author = data.author_name || data.author || undefined;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      datePublished,
      dateModified,
      author: author ? { "@type": "Person", name: author } : undefined,
      mainEntityOfPage: { "@type": "WebPage" },
      image: image || undefined,
    };

    return { title, description, image, jsonLd };
  } catch {
    return null;
  }
}

/**
 * Resolver utama berdasarkan pathname.
 * Tambah pola lain kalau perlu, mis. /stories/:id, /gallery/:slug, dll.
 */
export async function resolveSeoFromPath(pathname: string): Promise<ResolvedMeta | null> {
  // /campaign/:slug
  const mCampaign = pathname.match(/^\/campaign\/([^/?#]+)/i);
  if (mCampaign?.[1]) {
    const slug = decodeURIComponent(mCampaign[1]);
    const meta = await resolveCampaign(slug);
    if (meta) return meta;
  }

  // /p/:slug  (artikel)
  const mArticle = pathname.match(/^\/p\/([^/?#]+)/i);
  if (mArticle?.[1]) {
    const slug = decodeURIComponent(mArticle[1]);
    const meta = await resolveArticle(slug);
    if (meta) return meta;
  }

  // bisa ditambah pola lain di sini…

  return null;
}
