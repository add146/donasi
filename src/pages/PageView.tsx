// src/pages/PageView.tsx
import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "../lib/supabase";
import { renderMarkdownSafe } from "../lib/markdown";

// Bagian yang sudah ada di proyek
import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import ImpactStats from "../components/ImpactStats";
import Campaigns from "../components/Campaigns";
import Stories from "../components/Stories";
import Gallery from "../components/Gallery";
import HowItWorks from "../components/HowItWorks";
import PartnershipTeaser from "../components/PartnershipTeaser";
import AppPromo from "../components/AppPromo";
import ArticlesSection from "../components/home/ArticlesSection";
import { Sidebar as Widgets } from "../components/widgets"; // komposer widget
import Banner from "../components/banners/Banner";          // slot iklan/banner

type PageOptions = { show_title?: boolean; show_image?: boolean };

type PageRow = {
  title: string;
  slug?: string | null;
  content_md: string;
  image_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: "draft" | "published" | null;
  sections_json?: unknown;       // array string atau string JSON
  options_json?: PageOptions | string | null; // object atau string JSON
};

type SectionKey =
  | "header"
  | "hero"
  | "impact"
  | "campaigns"
  | "articles"
  | "stories"
  | "gallery"
  | "howitworks"
  | "partnership"
  | "apppromo"
  | "content"       // markdown page content
  | "widgets"       // sidebar / komposer widget
  | "banner_inline"
  | "banner_footer"
  | "footer";

// Utils
function stripHtml(html: string) {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return (div.textContent || div.innerText || "").trim();
}
function fmtDate(s?: string | null) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PageView() {
  const { slug } = useParams<{ slug: string }>();
  const [row, setRow] = useState<PageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Fetch data page (published saja)
  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(null);
      setLoading(true);
      const { data, error } = await supabase
        .from("pages")
        .select(
          "title, slug, content_md, image_url, created_at, updated_at, status, sections_json, options_json"
        )
        .eq("slug", slug as string)
        .eq("status", "published")
        .maybeSingle();

      if (!alive) return;
      if (error) setErr(error.message);
      setRow((data as PageRow) || null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  // Markdown → HTML (sudah disanitasi di helper)
  const html = useMemo(
    () => renderMarkdownSafe(row?.content_md || ""),
    [row?.content_md]
  );

  // Normalisasi daftar section (array string); default: header + content + footer
  const sections: SectionKey[] = useMemo(() => {
    let conf: unknown = (row as any)?.sections_json;
    if (typeof conf === "string") {
      try {
        conf = JSON.parse(conf);
      } catch {
        conf = null;
      }
    }
    if (Array.isArray(conf) && conf.every((v) => typeof v === "string")) {
      return conf as SectionKey[];
    }
    return ["header", "content", "footer"];
  }, [row?.sections_json]);

  // Opsi tampilan judul/gambar
  const opts: PageOptions = useMemo(() => {
    let v: any = row?.options_json;
    if (typeof v === "string") {
      try {
        v = JSON.parse(v);
      } catch {
        v = null;
      }
    }
    return { show_title: true, show_image: true, ...(v || {}) };
  }, [row?.options_json]);

  // SEO
  const description = useMemo(() => stripHtml(html).slice(0, 160), [html]);

  if (loading) {
    return (
      <>
        <Header />
        <article className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-3 h-8 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mb-6 h-4 w-1/4 animate-pulse rounded bg-slate-200" />
          <div className="mb-6 aspect-[16/9] w-full animate-pulse rounded-2xl bg-slate-200" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        </article>
        <Footer />
      </>
    );
  }

  if (err || !row) return <Navigate to="/" replace />;

  // ====== Blocks ======
  function ContentBlock({ noWrap = false }: { noWrap?: boolean }) {
    const inner = (
      <>
        {opts.show_title !== false && (
          <header className="mb-6">
            <h1 className="text-3xl font-bold">{row!.title}</h1>
            {(row!.updated_at || row!.created_at) && (
              <div className="text-sm text-gray-500 mt-1">
                Diperbarui: {fmtDate(row!.updated_at || row!.created_at)}
              </div>
            )}
          </header>
        )}

        {opts.show_image !== false && row!.image_url && (
          <div className="mb-8 overflow-hidden rounded-2xl border bg-slate-50">
            <img
              src={row!.image_url}
              alt={row!.title}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        <article
          className="prose prose-slate lg:prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </>
    );
    return noWrap ? inner : <main className="mx-auto max-w-3xl px-4 py-8">{inner}</main>;
  }

  function WidgetsBlock({ noWrap = false }: { noWrap?: boolean }) {
    const body = <Widgets />;
    return noWrap ? body : <aside className="mx-auto max-w-6xl px-4">{body}</aside>;
  }

  // Pemetaan section selain content/widgets
  const SECTION_MAP: Record<
    Exclude<SectionKey, "content" | "widgets">,
    JSX.Element | null
  > = {
    header: <Header />,
    hero: <Hero />,
    impact: <ImpactStats />,
    campaigns: <Campaigns />,
    articles: <ArticlesSection />,
    stories: <Stories />,
    gallery: <Gallery />,
    howitworks: <HowItWorks />,
    partnership: <PartnershipTeaser />,
    apppromo: <AppPromo />,
    banner_inline: <Banner slot="article_inline" className="my-6" />,
    banner_footer: <Banner slot="article_footer" className="my-6" />,
    footer: <Footer />,
  };

  return (
    <>
      <Helmet>
        <title>{row.title}</title>
        {description && <meta name="description" content={description} />}
        <meta property="og:title" content={row.title} />
        {description && <meta property="og:description" content={description} />}
        {row.image_url && <meta property="og:image" content={row.image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={row.title} />
        {description && <meta name="twitter:description" content={description} />}
        {row.image_url && <meta name="twitter:image" content={row.image_url} />}
      </Helmet>

      {(() => {
        const hasContent = sections.includes("content");
        const hasWidgets = sections.includes("widgets");

        const rendered = new Set<string>();
        const out: JSX.Element[] = [];

        const renderPair = () => (
          <div key="main-grid" className="mx-auto max-w-6xl px-4 py-8">
            <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
              <div>
                <ContentBlock noWrap />
              </div>
              <aside>
                <WidgetsBlock noWrap />
              </aside>
            </div>
          </div>
        );

        sections.forEach((key, idx) => {
          if (key === "content" || key === "widgets") {
            if (rendered.has("content") || rendered.has("widgets")) return;

            if (hasContent && hasWidgets) {
              out.push(renderPair());
              rendered.add("content");
              rendered.add("widgets");
            } else if (key === "content") {
              out.push(<ContentBlock key={`content-${idx}`} />);
              rendered.add("content");
            } else {
              out.push(
                <div key={`widgets-${idx}`} className="mx-auto max-w-6xl px-4 py-8">
                  <WidgetsBlock />
                </div>
              );
              rendered.add("widgets");
            }
            return;
          }

          const el = SECTION_MAP[key as Exclude<SectionKey, "content" | "widgets">];
          if (el) out.push(<div key={`${key}-${idx}`}>{el}</div>);
        });

        return out;
      })()}
    </>
  );
}
