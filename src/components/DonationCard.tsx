import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

/** util kecil */
function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}
function rupiah(n: number | null | undefined) {
  if (n == null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

type DonationCardProps = {
  target: number;
  raised: number;
  onDonate?: () => void;   // optional: arahkan ke page / buka modal payment
  backLabel?: string;
};

export default function DonationCard({
  target,
  raised,
  onDonate,
  backLabel = "Kembali",
}: DonationCardProps) {
  const navigate = useNavigate();

  const { percent, isGoalReached } = useMemo(() => {
    const p = target > 0 ? Math.round((raised / target) * 100) : 0;
    return { percent: clamp(p), isGoalReached: p >= 100 };
  }, [target, raised]);

  return (
    <aside
      className="
        sticky top-24
        rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 overflow-hidden
        border border-gray-100
      "
      aria-label="Kartu Donasi"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 p-4">
        <div className="flex items-center justify-between text-amber-950">
          <span className="font-semibold">Dukungan Anda</span>
          <span className="text-sm font-medium bg-amber-100/70 rounded-full px-3 py-1">
            {percent}% tercapai
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6">
        <div className="text-sm text-gray-600 mb-2">Terkumpul</div>
        <div className="text-2xl font-extrabold tracking-tight text-gray-900">
          {rupiah(raised)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          dari <span className="font-medium text-gray-700">{rupiah(target)}</span>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="
                h-full rounded-full
                bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400
              "
              style={{ width: `${percent}%` }}
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 grid gap-2">
          <button
            onClick={onDonate}
            disabled={isGoalReached}
            className={`
              inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3
              text-white font-semibold shadow-md transition
              ${isGoalReached
                ? "bg-emerald-500 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]"}
            `}
          >
            {isGoalReached ? "Target Tercapai 🎉" : "Donasi Sekarang"}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="
              inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3
              bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium
              ring-1 ring-gray-200
            "
            aria-label={backLabel}
          >
            {backLabel}
          </button>
        </div>

        <div className="mt-4 text-[11px] leading-5 text-gray-500">
          Donasi aman, cepat, dan terdokumentasi. Laporan penyaluran tersedia setelah kampanye berjalan.
        </div>
      </div>
    </aside>
  );
}
