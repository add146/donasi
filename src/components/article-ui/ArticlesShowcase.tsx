/**
 * ArticlesShowcase.tsx (MAGAZINE — SUPER PREMIUM)
 * -----------------------------------------------
 * Layout:
 * - Kiri: HERO dengan gambar + overlay judul & excerpt (link ke detail)
 * - Kanan: 2 kolom list (maks 6, scroll bila lebih). Item kanan:
 *     • tidak link ke detail, hanya memilih artikel aktif
 *     • kartu aktif diberi background highlight
 *     • kartu lain bisa dihover (sedikit gelap), klik = set aktif di kiri
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Post } from "../../types/article";
import { cx, formatDate } from "./utils";
import SectionHeading from "./SectionHeading";

type Props = {
  posts: Post[];
  title?: string;
  linkAllHref?: string;
  maxList?: number; // jumlah item di kolom kanan (default 6)
};

export default function ArticlesShowcase({
  posts,
  title = "Artikel Terbaru",
  linkAllHref,
  maxList = 6,
}: Props) {
  const [selected, setSelected] = useState(0);
  const hero = posts[selected] ?? posts[0];
  const list = useMemo(() => {
    // sisanya selain yang terpilih; tetap tampil maksimal maxList
    const clone = posts.slice();
    clone.splice(selected, 1);
    return clone.slice(0, maxList);
  }, [posts, selected, maxList]);

  if (!posts?.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <SectionHeading
        title={title}
        right={
          linkAllHref ? (
            <a
              href={linkAllHref}
              className="text-sm text-blue-600 hover:underline"
            >
              Lihat semua
            </a>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        {/* LEFT: HERO (klik ke detail) */}
        <Link
          to={`/p/${hero.slug}`}
          className="group relative block overflow-hidden rounded-2xl border bg-black shadow-sm transition hover:shadow-md"
        >
          <div className="relative aspect-[16/9] w-full">
            {hero.cover_url && (
              <img
                src={hero.cover_url}
                alt={hero.title}
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-95"
              />
            )}
            {/* overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </div>

          {/* overlay text */}
          <div className="pointer-events-none absolute inset-0 flex items-end p-6 text-white">
            <div className="max-w-3xl">
              <div className="mb-1 text-xs/5 opacity-90">
                {formatDate(hero.published_at)}
              </div>
              <h3 className="mb-2 text-3xl font-semibold drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
                {hero.title}
              </h3>
              {hero.excerpt && (
                <p className="line-clamp-2 text-slate-100/95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                  {hero.excerpt}
                </p>
              )}
            </div>
          </div>
        </Link>

        {/* RIGHT: LIST (2 kolom, scroll; remove wrapper besar) */}
        <div
          className={cx(
            "max-h-[600px] overflow-y-auto pr-1",
            // styling scrollbar tipis (Firefox & WebKit via arbitrary properties)
            "[scrollbar-width:thin] [scrollbar-color:rgb(148_163_184)_transparent]"
          )}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {list.map((p) => {
              const isActive = p.id === hero.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(posts.findIndex(x => x.id === p.id))}
                  className={cx(
                    "group relative flex gap-3 rounded-xl border p-3 text-left transition",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500/60",
                    isActive
                      ? "bg-emerald-50 ring-2 ring-emerald-500/50"
                      : "bg-white hover:bg-slate-50"
                  )}
                >
                  {/* thumbnail */}
                  <div className="relative aspect-[16/10] w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {p.cover_url && (
                      <img
                        src={p.cover_url}
                        alt={p.title}
                        className={cx(
                          "absolute inset-0 h-full w-full object-cover transition duration-300",
                          isActive ? "" : "group-hover:scale-[1.03]"
                        )}
                      />
                    )}
                    {/* gelapkan saat hover (untuk non-aktif) */}
                    {!isActive && (
                      <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/5" />
                    )}
                  </div>

                  {/* text */}
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500">
                      {formatDate(p.published_at)}
                    </div>
                    <h4
                      className={cx(
                        "line-clamp-2 text-sm font-medium leading-snug",
                        "group-hover:underline"
                      )}
                    >
                      {p.title}
                    </h4>
                    {p.excerpt && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {p.excerpt}
                      </p>
                    )}
                  </div>

                  {/* “aktif” badge subtle */}
                  {isActive && (
                    <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      aktif
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
