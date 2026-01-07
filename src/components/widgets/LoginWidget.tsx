import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginWidget() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signing, setSigning] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSigning(true);
    setMsg("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setMsg("Berhasil masuk.");
    } catch (err: any) {
      setMsg(err?.message || "Gagal login.");
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 text-sm font-semibold">Masuk Akun</div>
      <form onSubmit={onSubmit} className="grid gap-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-xl border px-3 py-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Kata sandi"
          className="w-full rounded-xl border px-3 py-2"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={signing}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow hover:opacity-95 disabled:opacity-60"
        >
          {signing ? "Memproses…" : "Masuk"}
        </button>
        {msg && <div className="text-sm text-slate-600">{msg}</div>}
      </form>
    </div>
  );
}
