import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Donation = {
  id: string;
  amount: number;
  donor_name: string | null;
  is_anonymous: boolean | null;
  channel: "qris" | "ewallet" | "bank" | string;
  status: "pending" | "paid" | "failed" | string;
  created_at: string;
  paid_at: string | null;
  campaign_id: string;
};

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

export default function DonateSuccess() {
  const [q] = useSearchParams();
  const ref = q.get("ref") || q.get("order_id");          // donation id
  const slug = q.get("slug") || "";  // campaign slug (agar bisa balik)
  const [row, setRow] = useState<Donation | null>(null);

  useEffect(() => {
  if (!ref) return;

  let cancelled = false;
  let timer: number | undefined;

  const fetchOnce = async () => {
    const { data } = await supabase
      .from("donations")
      .select(
        "id, amount, donor_name, is_anonymous, channel, status, created_at, paid_at, campaign_id"
      )
      .eq("id", ref)
      .maybeSingle();

    if (!cancelled) setRow(data as any);

    // stop polling ketika status final
    if (data && (data.status === "paid" || data.status === "failed")) {
      if (timer) window.clearInterval(timer);
    }
  };

  // muat awal
  fetchOnce();
  // polling tiap 3 detik
  timer = window.setInterval(fetchOnce, 3000);

  return () => {
    cancelled = true;
    if (timer) window.clearInterval(timer);
  };
}, [ref]);

const title =
  row?.status === "paid" ? "Pembayaran berhasil" :
  row?.status === "failed" ? "Pembayaran gagal" :
  "Menunggu konfirmasi pembayaran";

const subtitle =
  row?.status === "paid" ? "Terima kasih, donasi kamu sudah kami terima 🙏" :
  row?.status === "failed" ? "Maaf, pembayaran tidak berhasil." :
  "Pembayaran sedang diproses. Halaman ini akan diperbarui otomatis.";

  return (
    <section className="container-app py-16">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white ring-1 ring-emerald-200 p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            {/* check icon */}
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-emerald-800">{title}</h1>
            <p className="text-sm text-emerald-700">{subtitle}</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 p-5 grid sm:grid-cols-2 gap-3 text-sm">
          <Row label="Kode referensi" value={<Copyable text={ref || "-"} />} />
          <Row label="Status" value={<span className="font-medium text-emerald-800">{row?.status || "pending"}</span>} />
          <Row label="Nominal" value={<span className="font-medium">{formatIDR(row?.amount || 0)}</span>} />
          <Row label="Metode" value={row?.channel?.toUpperCase() || "-"} />
          <Row label="Donatur" value={row?.is_anonymous ? "Anonim" : row?.donor_name || "-"} />
          <Row label="Waktu" value={row?.paid_at
              ? new Date(row.paid_at).toLocaleString("id-ID")
              : (row?.created_at ? new Date(row.created_at).toLocaleString("id-ID") : "-")} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/campaign/${slug}`}
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Kembali ke campaign
          </Link>
          <Link to="/#campaigns" className="btn px-5 py-2.5 rounded-xl hover:bg-gray-50">
            Lihat campaign lain
          </Link>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-gray-600">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}

function Copyable({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text)}
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-gray-700 hover:bg-gray-50"
      title="Salin"
    >
      <span className="font-mono">{text}</span>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 7h8a2 2 0 012 2v9a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2z" />
        <path d="M16 7V5a2 2 0 00-2-2H8a2 2 0 00-2 2v2" />
      </svg>
    </button>
  );
}
