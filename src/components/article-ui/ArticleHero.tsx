/**
 * Hero card (besar) untuk artikel pertama.
 */
import { Link } from "react-router-dom";
import type { Post } from "../../types/article";
import { formatDate } from "./utils";

export default function ArticleHero({ post }: { post: Post }) {
  return (
    <Link
      to={`/p/${post.slug}`}
      className="group block overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        {post.cover_url && (
          <img
            src={post.cover_url}
            alt={post.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        )}
      </div>
      <div className="p-5">
        <div className="text-xs text-slate-500">{formatDate(post.published_at)}</div>
        <h3 className="mb-2 text-xl font-semibold leading-snug group-hover:underline">
          {post.title}
        </h3>
        {post.excerpt && <p className="line-clamp-3 text-slate-600">{post.excerpt}</p>}
      </div>
    </Link>
  );
}
