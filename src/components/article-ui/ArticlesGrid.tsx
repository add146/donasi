/**
 * Grid artikel reusable.
 * - variant "hero-3": 1 hero + 3 kartu kecil
 * - title?: judul section
 * - linkAllHref?: link "Lihat semua"
 */
import type { Post } from "../../types/article";
import ArticleHero from "./ArticleHero";
import ArticleCard from "./ArticleCard";

type Props = {
  posts: Post[];
  title?: string;
  linkAllHref?: string;
  variant?: "hero-3";
};

export default function ArticlesGrid({
  posts,
  title = "Artikel Terbaru",
  linkAllHref,
  variant = "hero-3",
}: Props) {
  if (!posts?.length) return null;

  const [first, ...rest] = posts;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {linkAllHref && (
          <a href={linkAllHref} className="text-sm text-blue-600 hover:underline">
            Lihat semua
          </a>
        )}
      </div>

      {variant === "hero-3" && (
        <div className="grid gap-6 md:grid-cols-2">
          <ArticleHero post={first} />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3">
            {rest.slice(0, 3).map((p) => (
              <ArticleCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
