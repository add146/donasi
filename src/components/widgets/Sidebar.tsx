/**
 * Sidebar.tsx
 * Komposer widget sidebar dengan slot banner dinamis.
 * Urutan:
 * 1) Banner 'sidebar_top'
 * 2) Campaigns
 * 3) Banner 'sidebar_middle'
 * 4) Login
 * 5) Newsletter
 * 6) Banner 'sidebar_bottom'
 *
 * Catatan:
 * - Semua banner dikelola dari Admin (tabel `public.banners`, kolom `slots`).
 * - Jika masih ingin banner partner statis, bisa ditaruh di bawah sebagai fallback.
 */
import LoginWidget from "./LoginWidget";
import CampaignsWidget from "./CampaignsWidget";
// import PartnerBannerWidget from "./PartnerBannerWidget"; // ← tidak dipakai lagi (optional fallback)
import NewsletterWidget from "./NewsletterWidget";
import Banner from "../banners/Banner";

export default function Sidebar() {
  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      {/* Banner paling atas sidebar */}
      <Banner slot="sidebar_top" className="mb-4" />
      {/* Daftar campaign dari DB (ikut RLS) */}
      <CampaignsWidget limit={5} />

      {/* Banner di tengah sidebar */}
      <Banner slot="sidebar_middle" className="my-4" />

      {/* Widget login mini */}
      <LoginWidget />

      {/* Newsletter */}
      <NewsletterWidget />

      {/* Banner paling bawah sidebar */}
      <Banner slot="sidebar_bottom" className="mt-4" />

      {/* Fallback lama (hapus jika tidak dipakai):
      <PartnerBannerWidget />
      */}
    </aside>
  );
}
