export default function PartnerBannerWidget() {
  return (
    <div className="rounded-2xl border bg-white p-0 shadow-sm">
      <div className="rounded-t-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-sky-500 p-4 text-white">
        <div className="text-sm opacity-90">Kemitraan</div>
        <div className="text-lg font-semibold">Ajak Perusahaan Anda Berkolaborasi</div>
      </div>
      <div className="p-4">
        <p className="text-sm text-slate-600">
          Tempat banner/CTA mitra. Konten & tautan diisi dari Admin nanti.
        </p>
        <a
          href="#"
          className="mt-3 inline-flex rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
        >
          Ajukan Kemitraan
        </a>
      </div>
    </div>
  );
}
