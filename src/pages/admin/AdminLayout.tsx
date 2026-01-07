// src/pages/admin/AdminLayout.tsx
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { NAV } from "./_nav";
import { Menu, X, Search, Bell, ChevronDown, LogOut, MessageCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function AdminLayout() {
  const [open, setOpen] = useState(false); // sidebar tertutup default (mobile)
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Ambil email user & dengarkan perubahan sesi
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Tutup sidebar saat navigasi (agar rapi di mobile)
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const title = useMemo(() => {
    const hit = NAV.find((n) => location.pathname.startsWith(n.to));
    return hit?.label ?? "Dashboard";
  }, [location.pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/admin", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="container-app h-14 flex items-center gap-3">
          <button
            onClick={() => setOpen((s) => !s)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 md:hidden"
            aria-label="Toggle sidebar"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="font-serif text-xl font-semibold">
            Dashboard
          </Link>

          {/* Search */}
          <div className="ml-auto md:ml-6 flex-1 md:flex-none">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="bg-transparent outline-none text-sm w-[360px]"
                placeholder="Cari campaign, cerita, partner…"
              />
            </div>
          </div>

        

          <div className="ml-1 flex items-center gap-2">
            <div className="px-2 py-1 rounded-xl border bg-white flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-amber-400 grid place-items-center text-white text-xs font-bold">
                {userEmail ? userEmail[0]?.toUpperCase() : "A"}
              </div>
              <span className="text-sm max-w-[160px] truncate" title={userEmail ?? "Admin"}>
                {userEmail ?? "Admin"}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>

            <button
              onClick={handleSignOut}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-white"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Keluar</span>
            </button>

            {/* Actions */}
<button className="ml-3 p-2 rounded-lg hover:bg-slate-100">
  <Bell className="h-5 w-5 text-slate-500" />
</button>

{/* HUB SUPPORT (WA) — NEW */}
<a
  href="https://wa.me/6285822072349"
  target="_blank"
  rel="noopener noreferrer"
  className="ml-2 hidden md:inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
  title="Hubungi Support via WhatsApp"
>
  <MessageCircle className="h-4 w-4" />
  <span className="text-sm">Hub Support</span>
</a>

{/* versi mobile (ikon saja) */}
<a
  href="https://wa.me/6285822072349"
  target="_blank"
  rel="noopener noreferrer"
  className="md:hidden ml-2 p-2 rounded-lg hover:bg-emerald-50 text-emerald-700"
  aria-label="Hub Support"
  title="Hubungi Support via WhatsApp"
>
  <MessageCircle className="h-5 w-5" />
</a>

          </div>
        </div>
      </header>

      {/* Overlay untuk mobile ketika sidebar terbuka */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="container-app grid md:grid-cols-[240px,1fr] gap-6 py-6">
        {/* Sidebar */}
        <aside
          className={[
            "md:sticky md:top-20 h-fit z-40",
            // Mobile: tampil sebagai panel mengambang
            "md:relative md:translate-x-0 transition-transform",
            open ? "translate-x-0" : "-translate-x-2 md:translate-x-0",
          ].join(" ")}
        >
          <nav className="rounded-2xl border bg-white p-2 shadow-sm">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 px-3 py-2 rounded-xl transition",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "hover:bg-slate-50 text-slate-700",
                  ].join(" ")
                }
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
              </NavLink>
            ))}

            <div className="mt-3 border-t pt-3">
              <Link
                to="/"
                className="block px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl"
              >
                ← Kembali ke situs publik
              </Link>
            </div>
          </nav>

          {/* Quick info card */}
          <div className="mt-4 rounded-2xl border bg-gradient-to-br from-emerald-50 to-white p-4 text-sm">
            <div className="font-medium mb-1">Ringkasan</div>
            <ul className="space-y-1 text-slate-600">
              <li>• Lead kemitraan baru otomatis tampil di “Kemitraan”.</li>
              <li>• Campaign “draft” tidak terlihat publik.</li>
            </ul>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0">
          {/* Sembunyikan judul global agar tidak dobel dengan judul di section.
             Tetap ada <h1> untuk aksesibilitas, tapi disembunyikan secara visual. */}
          <h1 className="sr-only">{title}</h1>

          {/* Tarik kartu utama sedikit ke atas supaya sejajar dengan sidebar */}
          <div className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm -mt-2 md:-mt-3">
            <Outlet />
          </div>

          <footer className="text-slate-400 text-xs text-center py-6">
            © {new Date().getFullYear()} GRAHAKITA — Admin
          </footer>
        </main>
      </div>
    </div>
  );
}
