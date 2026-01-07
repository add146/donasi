import { useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";

const FN_BASE = (import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || "").trim();

/** ---------------------- Types & helpers ---------------------- */
type Tier = "silver" | "gold" | "platinum" | "custom";

const tiers: {
  id: Tier;
  name: string;
  price: string;
  highlight?: boolean;
  features: string[];
}[] = [
  {
    id: "silver",
    name: "Silver",
    price: "Mulai 5jt/bulan",
    features: [
      "Branding di halaman kampanye",
      "Logo di laporan penyaluran",
      "Quarterly laporan dampak",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: "Mulai 20jt/bulan",
    highlight: true,
    features: [
      "Branding premium di homepage",
      "Co-branding konten penyaluran",
      "Laporan bulanan & sesi review",
      "Prioritas placement kampanye",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: "Custom (annual)",
    features: [
      "Program sosial tailor-made",
      "PR & media bersama",
      "Dashboard data & audit impact",
      "Kampanye eksklusif + aktivasi",
    ],
  },
];

const benefits = [
  { title: "Brand Visibility", desc: "Eksposur logo & cerita brand di titik strategis situs." },
  { title: "Real Impact", desc: "Program tepat sasaran dengan metrik dan laporan periodik." },
  { title: "Co-creation", desc: "Bikin program sosial khusus bareng tim kami." },
  { title: "PR & Content", desc: "Liputan aktivitas & konten storytelling bersama." },
  { title: "Governance", desc: "Audit trail & dokumentasi penyaluran transparan." },
  { title: "Priority Support", desc: "Team dedicated untuk koordinasi dan eksekusi." },
];

const faqs = [
  {
    q: "Apakah paket bisa disesuaikan?",
    a: "Bisa. Pilih paket sebagai baseline lalu beri catatan kebutuhan khusus pada form. Tim kami akan menyusun proposal custom.",
  },
  {
    q: "Bagaimana pelaporan dampak?",
    a: "Kami sediakan laporan periodik (bulanan/quarterly) meliputi penyerapan dana, penerima manfaat, dokumentasi, dan insight singkat.",
  },
  {
    q: "Apakah ada minimum komitmen?",
    a: "Silver & Gold bersifat bulanan (dapat dihentikan kapan saja), sementara Platinum biasanya berbasis annual dengan target program.",
  },
  {
    q: "Metode pembayaran yang didukung?",
    a: "Transfer bank, e-wallet, atau termin invoice perusahaan. Detail akan kami kirim setelah proposal disepakati.",
  },
];

/** ---------------------- Page ---------------------- */
export default function Sponsorship() {
  const [selectedTier, setSelectedTier] = useState<Tier>("gold");
  const formRef = useRef<HTMLDivElement>(null);

  const onSelectTier = (t: Tier) => {
    setSelectedTier(t);
    // smooth scroll ke form
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Header />
    <div className="bg-gradient-to-b from-white to-[#fbfcff]">
      {/* Hero */}
      <section className="container-app pt-14 sm:pt-16">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-brand-primary border-brand-primary/30 bg-brand-primary/5">
              Kemitraan & Sponsorship
            </span>
            <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-bold tracking-tight">
              Kolaborasi untuk <span className="text-brand-primary">dampak sosial</span> yang nyata
            </h1>
            <p className="mt-4 text-gray-600">
              Jadikan kebaikan sebagai strategi brand. Pilih paket, sesuaikan kebutuhan, dan
              biarkan kami eksekusi serta melaporkan dampaknya secara transparan.
            </p>

            <div className="mt-6 flex gap-3">
              <a
                href="#pricing"
                className="btn-accent px-6 py-3 rounded-xl shadow hover:shadow-md transition"
              >
                Lihat Paket
              </a>
              <a
                href="#apply"
                className="btn px-6 py-3 rounded-xl border hover:bg-gray-50"
                onClick={(e) => {
                  e.preventDefault();
                  formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Ajukan Kemitraan
              </a>
            </div>
          </div>

          {/* visual */}
          <div className="relative">
            <div className="aspect-[5/3] rounded-3xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-primary/20 via-brand-primary/5 to-transparent border shadow-sm" />
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="rounded-2xl border bg-white/70 backdrop-blur p-5 shadow-sm">
                <div className="text-sm text-gray-500">Contoh aktivasi</div>
                <div className="mt-1 font-medium">Brand Day of Giving • 3.200 penerima</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container-app py-12 sm:py-14">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Kenapa bermitra?</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow transition"
            >
              <div className="h-9 w-9 rounded-lg bg-brand-primary/10 text-brand-primary grid place-items-center text-sm font-bold">
                {/* simple icon dot */}
                ♥
              </div>
              <div className="mt-3 font-medium">{b.title}</div>
              <div className="mt-1 text-sm text-gray-600">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container-app pb-6 sm:pb-8">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Paket sponsorship</h2>
          <div className="text-sm text-gray-500">Klik paket untuk memilihnya</div>
        </div>

        <div className="mt-6 grid lg:grid-cols-3 gap-5">
          {tiers.map((t) => (
            <PricingCard
              key={t.id}
              data={t}
              active={selectedTier === t.id}
              onSelect={() => onSelectTier(t.id)}
            />
          ))}
        </div>
      </section>

      {/* Lead form */}
      <section id="apply" ref={formRef} className="container-app py-12 sm:py-14">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Ajukan kemitraan</h2>
        <p className="mt-1 text-gray-600">
          Isi form singkat di bawah ini. Tim kami akan menghubungi dalam 1–2 hari kerja dengan
          proposal & rincian kerja sama.
        </p>

        <div className="mt-6 grid lg:grid-cols-[1.2fr,0.8fr] gap-6">
          <LeadForm defaultTier={selectedTier} />
          <SideNotes />
        </div>
      </section>

      {/* FAQ */}
      <section className="container-app pb-16">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Pertanyaan umum</h2>
        <div className="mt-6 divide-y rounded-2xl border bg-white shadow-sm">
          {faqs.map((f, i) => (
            <FAQ key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </section>
    </div>
    <Footer />
    </>
  );
}

/** ---------------------- UI bits ---------------------- */

function PricingCard({
  data,
  onSelect,
  active,
}: {
  data: (typeof tiers)[number];
  onSelect: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "text-left rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow",
        data.highlight ? "ring-2 ring-brand-primary/60 border-brand-primary/30" : "",
        active ? "outline outline-2 outline-brand-primary/60" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{data.name}</div>
        {data.highlight && (
          <span className="rounded-full bg-brand-primary/10 text-brand-primary text-xs px-2 py-1">
            Rekomendasi
          </span>
        )}
      </div>
      <div className="mt-1 text-sm text-gray-600">{data.price}</div>

      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {data.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-primary/80" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 inline-flex items-center gap-2 text-brand-primary text-sm">
        Pilih paket
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M5 12h12M13 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

function SideNotes() {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="font-medium">Yang kami butuhkan</div>
      <ul className="mt-2 text-sm text-gray-700 space-y-1.5">
        <li>• Profil singkat brand/perusahaan</li>
        <li>• Preferensi paket dan estimasi anggaran</li>
        <li>• Sasaran/tema sosial yang diinginkan</li>
      </ul>

      <div className="mt-5 font-medium">SLA & pelaporan</div>
      <ul className="mt-2 text-sm text-gray-700 space-y-1.5">
        <li>• Proposal awal dalam 2–5 hari kerja</li>
        <li>• Pelaporan periodik sesuai paket</li>
        <li>• Dashboard ringkas untuk monitoring</li>
      </ul>

      <div className="mt-5 rounded-xl bg-brand-primary/5 text-brand-primary text-sm p-4">
        Punya deck kemitraan? Kirimkan ke{" "}
        <a href="mailto:partnership@asabersama.org" className="underline">
          partnership@asabersama.org
        </a>
        .
      </div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full px-5 py-4 text-left flex items-center justify-between"
      >
        <div className="font-medium">{q}</div>
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-400">
          <path
            d={open ? "M6 12h12" : "M12 6v12M6 12h12"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && <div className="px-5 pb-4 text-sm text-gray-600">{a}</div>}
    </div>
  );
}

/** ---------------------- Lead form ---------------------- */

function LeadForm({ defaultTier }: { defaultTier: Tier }) {
  const [tier, setTier] = useState<Tier>(defaultTier);
  const [company, setCompany] = useState("");
  const [person, setPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [agree, setAgree] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const emailOk = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const valid = company.trim() && person.trim() && emailOk && agree;

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!valid) return;

  setSubmitting(true);
  try {
    // 1) simpan lead ke Supabase
    const { error } = await supabase
      .from("partnership_leads")
      .insert({
        company_name: company,
        contact_name: person,
        email,
        phone,
        interested_tier: tier,
        monthly_budget: budget || null,
        message: message || null,
        agree_terms: agree,
      });

    if (error) throw error;

    // 2) kirim notifikasi email via Edge Function (opsional tapi direkomendasikan)
    if (FN_BASE) {
      // ref_id diset seadanya (karena kita tidak select id), ini hanya untuk referensi di email
      const ref_id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      await fetch(`${FN_BASE}/notify-partnership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_id,
          company_name: company,
          contact_name: person,
          email,
          phone,
          package: tier,
          budget: Number(budget || 0),
          notes: message,
        }),
      }).catch((e) => console.warn("notify-partnership error:", e));
    }

    setSuccessId("OK");
    setMessage("");
  } catch (err) {
    console.error(err);
    alert("Gagal mengirim. Coba lagi ya.");
  } finally {
    setSubmitting(false);
  }
}

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nama perusahaan/brand" required>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-xl border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
            />
          </Field>
          <Field label="Nama PIC" required>
            <input
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className="w-full rounded-xl border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Email PIC" required hint={!emailOk ? "Format email belum valid" : undefined}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
            />
          </Field>
          <Field label="Telepon (opsional)">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Paket minat">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier)}
              className="w-full rounded-xl border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
            >
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
              <option value="custom">Custom</option>
            </select>
          </Field>
          <Field label="Estimasi budget bulanan (opsional)">
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="cth: 20.000.000"
              className="w-full rounded-xl border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
            />
          </Field>
        </div>

        <Field label="Catatan (opsional)">
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
            placeholder="Tema sosial, lokasi, target penerima, dll."
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="rounded border-gray-300"
          />
          Saya setuju untuk dihubungi dan data saya digunakan untuk kebutuhan proposal.
        </label>

        <div className="pt-2 flex items-center gap-3">
          <button
            disabled={!valid || submitting}
            className="btn-accent px-6 py-3 rounded-xl shadow disabled:opacity-60"
          >
            {submitting ? "Mengirim..." : "Kirim pengajuan"}
          </button>
          {successId && (
            <span className="text-sm text-emerald-700">
              Terima kasih! Kode referensi: <span className="font-mono">{successId}</span>
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium">
        {label} {required && <span className="text-rose-500">*</span>}
      </div>
      <div className="mt-1">{children}</div>
      {hint && <div className="mt-1 text-xs text-rose-600">{hint}</div>}
    </label>
  );
}
