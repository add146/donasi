import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Lock, Mail, ArrowLeft, KeyRound, Sparkles } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Jika sudah login, langsung masuk
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/admin", { replace: true });
    });
    return () => { sub.subscription.unsubscribe(); };
  }, [navigate]);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setNotice(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message || "Gagal login."); return; }
    navigate(from, { replace: true });
  }

  async function handleMagicLink(e: React.MouseEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setNotice(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        // penting: agar tidak membuat user baru dari magic link
        shouldCreateUser: false,
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setNotice("Magic link terkirim. Cek email kamu dan klik tautannya untuk masuk.");
  }

  async function handleResetPassword(e: React.MouseEvent) {
    e.preventDefault();
    if (!email) { setError("Isi email terlebih dahulu untuk reset password."); return; }
    setLoading(true); setError(null); setNotice(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setNotice("Tautan reset password telah dikirim ke email kamu.");
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
          <div className="mb-6 flex items-center gap-4">
  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60">
    <Lock className="h-8 w-8" />
  </div>
  <div className="min-w-0">
    <h1 className="text-3xl font-serif font-bold leading-tight">Admin Login</h1>
    <p className="text-slate-600">Hanya untuk akun yang sudah terdaftar</p>
  </div>
</div>

          {/* Fields */}
          <form onSubmit={handlePasswordLogin} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm">Email</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border px-3 py-2 focus-within:ring-1 focus-within:ring-emerald-500">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm">Password</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border px-3 py-2 focus-within:ring-1 focus-within:ring-emerald-500">
                <Lock className="h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full outline-none"
                />
              </div>
            </label>

            {/* Alerts */}
            {error && <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3">{error}</div>}
            {notice && <div className="rounded-xl bg-emerald-50 text-emerald-700 text-sm p-3">{notice}</div>}

            {/* Row: Login + Reset Password */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 rounded-xl bg-emerald-600 text-white py-2.5 font-medium hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? "Memproses…" : "Login"}
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading || !email}
                className="w-1/2 rounded-xl border border-emerald-200 py-2.5 font-medium hover:bg-emerald-50 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                title="Kirim tautan reset password ke email"
              >
                <KeyRound className="h-4 w-4" />
                Reset Password
              </button>
            </div>

            {/* Magic link */}
            <button
              onClick={handleMagicLink}
              disabled={loading || !email}
              className="w-full rounded-xl border border-slate-300 py-2.5 font-medium hover:bg-slate-50 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Kirim Magic Link
            </button>
          </form>

          {/* Credit */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Web Development by <span className="font-semibold">TAcademy ID</span>
          </p>
        </div>
      </div>
    </div>
  );
}
