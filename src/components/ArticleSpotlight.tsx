import { Link } from "react-router-dom";

export type ArticleItem = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  excerpt?: string | null;
  published_at?: string | null;
};

export default function ArticleSpotlight({ items }: { items: ArticleItem[] }) {
  if (!items?.length) return null;

  const [first, ...rest] = items;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Kartu besar */}
      <Link
        to={`/p/${first.slug}`}
        className="group relative overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200 lg:col-span-2"
      >
        <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-gray-100">
          <img
            src={first.cover_url ?? "/assets/placeholder-16x9.jpg"}
            alt={first.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-slate-800 group-hover:text-emerald-700">
            {first.title}
          </h3>
          {first.excerpt ? (
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{first.excerpt}</p>
          ) : null}
        </div>
      </Link>

      {/* Kolom samping: 3 kecil */}
      <div className="space-y-4">
        {rest.slice(0, 3).map((a) => (
          <Link
            key={a.id}
            to={`/p/${a.slug}`}
            className="group flex gap-3 overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200"
          >
            <div className="shrink-0 w-32 sm:w-36">
              <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <img
                  src={a.cover_url ?? "/assets/placeholder-4x3.jpg"}
                  alt={a.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="flex min-w-0 flex-col justify-center p-3">
              <h4 className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-emerald-700">
                {a.title}
              </h4>
              {a.excerpt ? (
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">{a.excerpt}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
