// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import SEO from './components/SEO';

// Public
import PublicHome from "./pages/PublicHome";
import CampaignDetail from "./pages/CampaignDetail";
import Donate from "./pages/Donate";
import DonateSuccess from "./pages/DonateSuccess";
import DonateFailed from "./pages/DonateFailed";
import Sponsorship from "./pages/Sponsorship"; // /kemitraan
import ArticlesAdmin from "./pages/admin/ArticlesAdmin";
import ArticleEditor from "./pages/admin/ArticleEditor";
import Article from "./pages/Article";
import About from "./pages/About";
import ContactPage from "./pages/Contact";
import PageView from './pages/PageView';

// Admin (lazy agar bundle awal kecil)
const RequireAuth   = lazy(() => import("./pages/admin/RequireAuth"));
const AdminLayout   = lazy(() => import("./pages/admin/AdminLayout"));
const AdminLogin    = lazy(() => import("./pages/admin/AdminLogin")); // <= LOGIN DI SINI
const CampaignsAdmin = lazy(() => import("./pages/admin/CampaignsAdmin"));
const StoriesAdmin   = lazy(() => import("./pages/admin/StoriesAdmin"));
const GalleryAdmin   = lazy(() => import("./pages/admin/GalleryAdmin"));
const PartnersAdmin  = lazy(() => import("./pages/admin/PartnersAdmin")); // NEW
const BannersAdmin   = lazy(() => import("./pages/admin/BannersAdmin"));
const BannerEditor   = lazy(() => import("./pages/admin/BannerEditor"));
const SettingsAdmin = lazy(() => import("./pages/admin/SettingsAdmin"));
const HowItWorksAdmin = lazy(() => import("./pages/admin/HowItWorksAdmin"));
const AboutAdmin    = lazy(() => import("./pages/admin/AboutAdmin"));
const AdminResetPassword = lazy(() => import("./pages/admin/AdminResetPassword"));
const PagesAdmin    = lazy(() => import("./pages/admin/PagesAdmin"));

function ScrollToTopOnRouteChange() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    // Matikan restorasi scroll bawaan browser
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    // Scroll dokumen ke atas setiap route berubah
    (document.scrollingElement || document.documentElement)
      .scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <Suspense
        fallback={
          <div className="min-h-screen grid place-items-center text-gray-500">
            Memuat…
          </div>
        }
      >
        {/* SEO global, otomatis baca Admin + path saat ini */}
        <SEO />
        
        <Routes>
          {/* Public */}
          <Route path="/" element={<PublicHome />} />
          <Route path="/campaign/:slug" element={<CampaignDetail />} />
          <Route path="/donate/:slug" element={<Donate />} />
          <Route path="/donate/success" element={<DonateSuccess />} />
          <Route path="/donate/failed" element={<DonateFailed />} />
          <Route path="/kemitraan" element={<Sponsorship />} />
          <Route path="/p/:slug" element={<Article />} />
          <Route path="/tentang-kami" element={<About />} />
          <Route path="/kontak" element={<ContactPage />} />
          <Route path="/halaman/:slug" element={<PageView />} />

          {/* Login admin (TIDAK di-guard) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/reset-password" element={<AdminResetPassword />} />

          {/* Redirect /admin -> /admin/login agar tidak ambigu */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

          {/* Area admin (DI-GUARD) */}
          <Route element={<RequireAuth />}>
            <Route path="/admin/*" element={<AdminLayout />}>
              {/* default: masuk ke partners */}
              <Route index element={<Navigate to="partners" replace />} />
              <Route path="about" element={<AboutAdmin />} />
              <Route path="partners"  element={<PartnersAdmin />} />
              <Route path="campaigns" element={<CampaignsAdmin />} />
              <Route path="stories"   element={<StoriesAdmin />} />
              <Route path="gallery"   element={<GalleryAdmin />} />
              <Route path="articles" element={<ArticlesAdmin />} />
              <Route path="articles/new" element={<ArticleEditor />} />
              <Route path="articles/:id" element={<ArticleEditor />} />
              <Route path="banners" element={<BannersAdmin />} />
              <Route path="banners/new" element={<BannerEditor />} />
              <Route path="banners/:id" element={<BannerEditor />} />
              <Route path="howitworks" element={<HowItWorksAdmin />} />
              <Route path="settings" element={<SettingsAdmin />} />
              <Route path="halaman" element={<PagesAdmin />} />
              {/* fallback di dalam dashboard */}
              <Route path="*" element={<Navigate to="partners" replace />} />
            </Route>
          </Route>

          {/* Fallback global */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
