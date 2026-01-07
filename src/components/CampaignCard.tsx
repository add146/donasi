import { Link } from "react-router-dom";
import { fmtIDR, percent } from "../lib/money";

type Props = {
  title: string;
  summary: string;
  image: string;
  target_amount: number;
  raised_amount: number;
  slug: string;
  category?: string;
};

export default function CampaignCard({
  title, summary, image, target_amount, raised_amount, slug, category,
}: Props) {
  const pct = percent(raised_amount, target_amount);
  const isUrgent = (category || "").toLowerCase() === "mendesak";

  return (
    <article className="card overflow-hidden">
      <div className="relative h-44 w-full bg-gray-100">
        {image ? <img src={image} alt={title} className="h-44 w-full object-cover" /> : null}
        {category && (
          <span
          className={[
            "absolute top-3 left-3",
            "px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold",
            "shadow ring-1 ring-black/5",
              // kuning brand untuk semua kategori; kalau mau beda untuk non-mendesak, tinggal kondisikan
            "bg-brand-accent text-gray-900"
            ].join(" ")}
          >
          {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
          )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold line-clamp-2">{title}</h3>
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{summary}</p>

        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
            <span>Terkumpul {pct}%</span>
            <span>{fmtIDR(raised_amount)} / {fmtIDR(target_amount)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm">
            <div className="text-gray-500">Target</div>
            <div className="font-semibold">{fmtIDR(target_amount)}</div>
          </div>
          <Link to={`/campaign/${slug}`} className="btn-accent px-4 py-2 rounded-full text-[13px] lift">
            Lihat detail
          </Link>
        </div>
      </div>
    </article>
  );
}
