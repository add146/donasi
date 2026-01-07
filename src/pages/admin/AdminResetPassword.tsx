import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";

export default function AdminResetPassword() {
  const nav = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Jika sudah ada session dari link recovery, halaman ini siap update password.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        // biasanya link akan meng-autosignin. Jika tidak ada session, arahkan balik ke login
        setError("Sesi tidak ditemukan. Silakan buka tautan reset dari email Anda.");
      }
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pwd || pwd.length < 8) { setError("Password minimal 8 karakter."); return; }
    if (pwd !== pwd2) { setError("Konfirmasi password tidak cocok."); return; }
    setLoading(true); setError(null); setNotice(null);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setNotice("Password berhasil diubah. Mengalihkan ke halaman Admin…");
    setTimeout(() => nav("/admin", { replace: true }), 900);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="container-app py-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke situs
          </Link>
        </div>

        <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 md:p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 rounded-xl bg-emerald-100 grid place-items-center text-emerald-700">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="mt-3 text-2xl font-serif font-semibold">Atur Ulang Password</h1>
            <p className="text-slate-500 text-sm">Masukkan password baru untuk akun Anda.</p>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm">Password baru</span>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            <label className="block">
              <span className="text-sm">Ulangi password baru</span>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error && <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3">{error}</div>}
            {notice && <div className="rounded-xl bg-emerald-50 text-emerald-700 text-sm p-3">{notice}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 text-white py-2.5 font-medium hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Memproses…" : "Simpan Password Baru"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
