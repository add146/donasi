import { useState } from "react";

export default function NewsletterWidget() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState<null | boolean>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder: nanti dihubungkan ke endpoint/table newsletter_subscribers
    setOk(true);
    setEmail("");
    setTimeout(() => setOk(null), 2000);
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-2 text-sm font-semibold">Newsletter</div>
      <p className="mb-3 text-sm text-slate-600">
        Dapatkan kabar terbaru dan cerita inspiratif.
      </p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email kamu"
          className="w-full rounded-xl border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
        >
          Daftar
        </button>
      </form>
      {ok === true && <div className="mt-2 text-sm text-emerald-700">Terima kasih! 🎉</div>}
    </div>
  );
}
