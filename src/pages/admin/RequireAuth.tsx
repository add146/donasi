import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

/**
 * Lindungi route admin.
 * - Cek session sekali saat mount
 * - Subscribe perubahan auth
 * - Tampilkan loader singkat saat inisialisasi
 * - Redirect ke /admin/login jika belum login
 */
export default function RequireAuth() {
  const location = useLocation();
  const [initializing, setInitializing] = useState(true);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthed(!!data.session);
      setInitializing(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setIsAuthed(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (initializing) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-slate-500">
        Memuat…
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname || "/admin" }}
      />
    );
  }

  return <Outlet />;
}
