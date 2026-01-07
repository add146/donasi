/**
 * Kartu artikel serbaguna (vertikal)
 * Props:
 * - post: Post
 * - showExcerpt?: boolean (default true)
 * - className?: string
 * - imageRatio?: "16/10" | "1/1" | "4/3"
 */
import { Link } from "react-router-dom";
import type { Post } from "../../types/article";
import { cx, formatDate } from "./utils";

type Props = {
  post: Post;
  showExcerpt?: boolean;
  className?: string;
  imageRatio?: "16/10" | "1/1" | "4/3";
};

const ratioCls: Record<NonNullable<Props["imageRatio"]>, string> = {
  "16/10": "aspect-[16/10]",
  "1/1": "aspect-square",
  "4/3": "aspect-[4/3]",
};

export default function ArticleCard({
  post,
  showExcerpt = true,
  className,
  imageRatio = "16/10",
}: Props) {
  return (
    <Link
      to={`/p/${post.slug}`}
      className={cx(
        "group block overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md",
        className
      )}
    >
      <div className={cx("relative w-full overflow-hidden rounded-xl bg-slate-100", ratioCls[imageRatio])}>
        {post.cover_url && (
          <img
            src={post.cover_url}
            alt={post.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="mt-3">
        <div className="text-xs text-slate-500">{formatDate(post.published_at)}</div>
        <h4 className="mt-1 line-clamp-2 font-medium leading-snug group-hover:underline">
          {post.title}
        </h4>
        {showExcerpt && post.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.excerpt}</p>
        )}
      </div>
    </Link>
  );
}
