import { Link, useSearchParams } from "react-router-dom";

export default function DonateFailed() {
  const [q] = useSearchParams();
  const slug = q.get("slug") || "";
  const ref = q.get("ref") || "";
  const msg = q.get("msg") || "Pembayaran dibatalkan / gagal diproses.";

  return (
    <section className="container-app py-16">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white ring-1 ring-red-200 p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
            {/* x icon */}
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-red-800">Pembayaran gagal</h1>
            <p className="text-sm text-red-700">{msg}</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-red-50 ring-1 ring-red-200 p-5 text-sm">
          <div className="text-gray-600">Kode referensi</div>
          <div className="mt-1 font-mono">{ref || "-"}</div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/donate/${slug}`}
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700"
          >
            Coba lagi
          </Link>
          <Link to={`/campaign/${slug}`} className="btn px-5 py-2.5 rounded-xl hover:bg-gray-50">
            Kembali ke campaign
          </Link>
        </div>
      </div>
    </section>
  );
}
