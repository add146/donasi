import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { HeaderContent } from "../types/siteContent";
import { ensurePublicUrl } from "../lib/uploadPublic";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [header, setHeader] = useState<HeaderContent | null>(null);

  const location = useLocation();
  const base = location.pathname === "/" ? "" : "/"; // anchor ke beranda saat bukan di "/"

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_content")
        .select("data")
        .eq("key", "header")
        .maybeSingle();

      setHeader((data?.data as HeaderContent) ?? null);
    })();
  }, []);

  const brandTitle = header?.title || "Asa Bersama";
  const logoUrl = ensurePublicUrl(header?.logo || undefined) || undefined;
  const useLogo = !!header?.useLogo && !!logoUrl;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* container */}
      <div className="container-app">
        {/* 3 kolom: kiri brand, tengah nav, kanan tombol */}
        <nav className="grid grid-cols-[auto,1fr,auto] items-center h-16 md:h-20 gap-3">
          {/* BRAND */}
          <a href="/" className="flex items-center gap-2 min-w-0">
            {useLogo ? (
              <img src={logoUrl} alt={brandTitle} className="h-8 w-auto md:h-9" />
            ) : (
              <span className="truncate text-xl md:text-2xl font-semibold">
                {brandTitle}
              </span>
            )}
          </a>

          {/* MENU (center) */}
<ul className="hidden md:flex justify-center items-center gap-10 text-[15px] font-medium">
  <li>
    <Link to="/" className="hover:text-brand-primary">
      Home
    </Link>
  </li>
  <li>
    <a href={`${base}#campaigns`} className="hover:text-brand-primary">
      Campaign
    </a>
  </li>
  <li>
    <Link to="/tentang-kami" className="hover:text-brand-primary">
    Tentang Kami
  </Link>
  </li>
  <li>
    <a href={`${base}#stories`} className="hover:text-brand-primary">
      Kisah Harapan
    </a>
  </li>
  <li>
    <li>
  <Link to="/kontak" className="hover:text-brand-primary">Kontak</Link>
</li>
  </li>
  <li>
    <Link to="/kemitraan" className="hover:text-brand-primary">
      Kemitraan
    </Link>
  </li>
</ul>


          {/* AKSI KANAN */}
          <div className="hidden md:block">
            <a
              href={`${base}#campaigns`}
              className="btn-accent px-7 md:px-8 py-3 rounded-full text-[16px]"
            >
              Donasi Sekarang
            </a>
          </div>

          {/* HAMBURGER (mobile) */}
          <button
            className="md:hidden justify-self-end p-2"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </nav>

        {/* MOBILE MENU */}
{open && (
  <div className="md:hidden mt-2 rounded-xl border bg-white p-4 shadow">
    <Link
      to="/"
      className="block py-2"
      onClick={() => setOpen(false)}
    >
      Home
    </Link>

    <a
      href={`${base}#campaigns`}
      className="block py-2"
      onClick={() => setOpen(false)}
    >
      Campaign
    </a>
    <Link
  to="/tentang-kami"
  className="block py-2"
  onClick={() => setOpen(false)}
>
  Tentang Kami
</Link>

    <a
      href={`${base}#stories`}
      className="block py-2"
      onClick={() => setOpen(false)}
    >
      Kisah Harapan
    </a>
    <Link to="/kontak" className="block py-2" onClick={() => setOpen(false)}>
  Kontak
</Link>
    <Link
      to="/kemitraan"
      className="block py-2"
      onClick={() => setOpen(false)}
    >
      Kemitraan
    </Link>

    <a
      href={`${base}#campaigns`}
      className="mt-3 btn-accent block w-full text-center rounded-xl py-3"
      onClick={() => setOpen(false)}
    >
      Donasi Sekarang
    </a>
  </div>
)}

      </div>
    </header>
  );
}
