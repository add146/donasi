import { Link } from "react-router-dom";
import { fmtIDR, percent } from "../lib/money";

type Props = {
  title: string;
  image: string;
  target_amount: number;
  raised_amount: number;
  slug: string;
  category?: string; // ← tambahkan kategori
};

export default function CampaignCardSmall({
  title,
  image,
  target_amount,
  raised_amount,
  slug,
  category,
}: Props) {
  const pct = percent(raised_amount, target_amount);

  return (
    <article className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* perlu relative agar badge bisa di-overlay */}
      <div className="relative h-28 w-full bg-gray-100">
        {image ? <img src={image} className="h-28 w-full object-cover" /> : null}

        {/* Badge kategori (pill kuning) */}
        {category && (
          <span
            className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-semibold
                       bg-brand-accent text-gray-900 shadow ring-1 ring-black/5"
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        )}
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-sm line-clamp-2">{title}</h4>

        {/* Progress */}
        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-gray-600">
            {fmtIDR(raised_amount)} / {fmtIDR(target_amount)}
          </div>
        </div>

        {/* Tombol detail: hijau seperti progress bar */}
        <Link
          to={`/campaign/${slug}`}
          className="mt-3 inline-flex items-center justify-center rounded-full
                     bg-emerald-600 hover:bg-emerald-700 text-white
                     text-[12px] px-3 py-1.5 shadow-sm transition"
        >
          Lihat detail
        </Link>
      </div>
    </article>
  );
}
