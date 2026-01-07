/**
 * PartnerStrip.tsx — Banner kemitraan horizontal
 * Ditaruh di tengah konten (setelah paragraf pertama).
 * Pakai placeholder kalau image/href kosong.
 */
export default function PartnerStrip({
  title = "Jadi Mitra Kebaikan",
  subtitle = "Bergabung sebagai mitra program kami. Bersama bantu lebih banyak penerima manfaat.",
  ctaText = "Hubungi Kami",
  href = "#",
  imageUrl,
}: {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  href?: string;
  imageUrl?: string;
}) {
  return (
    <a
      href={href}
      className="group my-8 block overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-sky-500 px-6 py-5 text-white">
        <div className="min-w-0">
          <div className="text-sm/5 opacity-90">Kemitraan</div>
          <div className="truncate text-xl font-semibold">{title}</div>
          <div className="line-clamp-2 text-sm text-emerald-50/95">{subtitle}</div>
          <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-emerald-700 transition group-hover:translate-x-0.5">
            {ctaText}
          </div>
        </div>
        <div className="ml-auto hidden w-56 shrink-0 overflow-hidden rounded-xl bg-white/10 p-2 sm:block">
          {imageUrl ? (
            <img src={imageUrl} alt="Mitra" className="h-28 w-full rounded-lg object-cover" />
          ) : (
            <div className="h-28 w-full rounded-lg bg-white/20" />
          )}
        </div>
      </div>
    </a>
  );
}
