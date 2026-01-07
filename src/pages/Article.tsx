import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "../lib/supabase";
import { Sidebar } from "../components/widgets";
import type { Post } from "../types/article";
import { SocialShare } from "../components/article-ui";
import Banner from "../components/banners/Banner";
import Header from "../components/Header";
import Footer from "../components/Footer";

type Row = Post & { content?: string | null };

function stripHtml(html: string) {
  const div =
    typeof document !== "undefined" ? document.createElement("div") : null;
  if (!div) return html;
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

// Ikon kecil (inline SVG, tanpa lib)
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M7 3v3m10-3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Format tanggal yang konsisten (fallback ke created_at bila published_at kosong)
function formatDate(s?: string | null) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "numeric", year: "numeric" });
}

// Hitung waktu baca (WPM 200, min 1 menit, tahan terhadap HTML kosong)
function calcReadingMin(html: string) {
  const text = (typeof document !== "undefined"
    ? (() => {
        const div = document.createElement("div");
        div.innerHTML = html || "";
        return (div.textContent || div.innerText || "").trim();
      })()
    : html || ""
  );
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return minutes;
}

function ensureHtmlParagraphs(s: string) {
  const v = (s || "").trim();
  if (!v) return "";
  if (/<\s*(p|br|h[1-6]|ul|ol|li|img|blockquote|pre|div|section|article)\b/i.test(v)) {
    return v; // sudah HTML
  }
  const blocks = v
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map(b => `<p>${b.replace(/\n/g, "<br/>")}</p>`);
  return blocks.join("\n");
}

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Post[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // Fetch artikel
  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(null);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug as string)
        .eq("status", "published")
        .maybeSingle();
      if (!alive) return;
      if (error) setErr(error.message);
      setRow((data as Row) || null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  // Fetch related
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("articles")
        .select("id,title,slug,excerpt,cover_url,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10);
      if (!alive) return;
      const list = ((data as Post[]) || [])
        .filter((p) => p.slug !== slug)
        .slice(0, 6);
      setRelated(list);
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  // Derivasi konten + reading time + pembagi paragraf
  const { html, firstHtml, restHtml, readingMin } = useMemo(() => {
    const htmlSrc = (row?.content_html ?? (row as any)?.content ?? "") as string;
    const htmlRaw = ensureHtmlParagraphs(htmlSrc);  // ← pastikan jadi HTML
    
    // cari penutup paragraf pertama (case-insensitive, aman karena lower tidak mengubah panjang string)
    const lower = htmlRaw.toLowerCase();
    const idx = lower.indexOf("</p>");
    const head = idx !== -1 ? htmlRaw.slice(0, idx + 4) : htmlRaw;
    const tail = idx !== -1 ? htmlRaw.slice(idx + 4) : "";

    const reading =
      Math.max(
        1,
        Math.ceil(stripHtml(htmlRaw).trim().split(/\s+/).filter(Boolean).length / 200)
      ) || 1;

    return { html: htmlRaw, firstHtml: head, restHtml: tail, readingMin: reading };
  }, [row?.content_html, (row as any)?.content]);

  if (loading) {
    return (
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
    );
  }

  if (!row) return <Navigate to="/" replace />;

  return (
    <>
      <Header />
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Helmet>
        <title>{row.title}</title>
        {row.excerpt && <meta name="description" content={row.excerpt} />}
        <meta property="og:title" content={row.title} />
        {row.excerpt && <meta property="og:description" content={row.excerpt} />}
        {row.cover_url && <meta property="og:image" content={row.cover_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={row.title} />
        {row.excerpt && <meta name="twitter:description" content={row.excerpt} />}
        {row.cover_url && <meta name="twitter:image" content={row.cover_url} />}
      </Helmet>

      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        {/* MAIN */}
        <article>
          <header className="mb-4">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{row.title}</h1>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              {/* Tanggal */}
              { (row.published_at || row.created_at) && (
              <span className="inline-flex items-center gap-1.5 text-sky-700">
                <CalendarIcon className="h-4 w-4 text-sky-600" />
              <span>{formatDate(row.published_at || row.created_at)}</span>
              </span>
              )}

              <span className="text-slate-400">•</span>

              {/* Menit baca */}
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <ClockIcon className="h-4 w-4 text-emerald-600" />
              <span>{calcReadingMin(html)} menit baca</span>
              </span>
              </div>
          </header>

          {row.cover_url && (
            <div className="mb-8 overflow-hidden rounded-2xl border bg-slate-50">
              <img
                src={row.cover_url}
                alt={row.title}
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          {/* Paragraf 1 */}
          <div className="prose prose-slate max-w-none">
            <div dangerouslySetInnerHTML={{ __html: firstHtml }} />
          </div>

            {/* Banner dinamis: slot 'article_inline' (diatur dari Admin) */}
              <Banner slot="article_inline" className="my-6" />

          {/* Sisa konten */}
          {restHtml && (
            <div className="prose prose-slate max-w-none">
              <div dangerouslySetInnerHTML={{ __html: restHtml }} />
            </div>
          )}

          {/* Share */}
          <div className="mt-10 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-2 text-sm font-semibold text-slate-700">
              Bagikan artikel ini
            </div>
            <SocialShare title={row.title} text={row.excerpt || ""} />
          </div>

          {/* Banner footer artikel */}
          <Banner slot="article_footer" className="my-6" />

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-10">
              <h3 className="mb-4 text-xl font-semibold">Artikel Terkait</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    to={`/p/${p.slug}`}
                    className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      {p.cover_url && (
                        <img
                          src={p.cover_url}
                          alt={p.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-xs text-slate-500">
                        {p.published_at &&
                          new Date(p.published_at).toLocaleDateString("id-ID")}
                      </div>
                      <h4 className="mt-1 line-clamp-2 font-medium leading-snug group-hover:underline">
                        {p.title}
                      </h4>
                      {p.excerpt && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                          {p.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* SIDEBAR (widget composer) */}
        <Sidebar />
      </div>
    </div>
    <Footer />
    </>
  );
}
