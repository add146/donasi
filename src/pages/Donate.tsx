import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Campaign } from "../types/campaign";
import Header from "../components/Header";
import Footer from "../components/Footer";

declare global {
  interface Window {
    snap?: { pay: (token: string, opts?: any) => void };
  }
}

/* ---------- utils ---------- */
const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(isNaN(n) ? 0 : n);

const toNumber = (s: string) => Number(String(s).replace(/[^\d]/g, "")) || 0;

type Channel = "qris" | "ewallet" | "bank";

const MIDTRANS_CLIENT_KEY = (import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "").trim();

/* ============ PAGE ============ */
export default function Donate() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [amount, setAmount] = useState<number>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<Channel>("qris");
  const [submitting, setSubmitting] = useState(false);
  const [createdRef, setCreatedRef] = useState<string | null>(null); // donation_id

  const presets = [25000, 50000, 100000, 250000, 500000];

  /* load campaign */
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        console.error("load campaign error:", error);
        setCampaign(null);
      } else {
        setCampaign(data as any);
      }
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  /* load Midtrans Snap.js (sandbox by default) */
  useEffect(() => {
    if (window.snap || !MIDTRANS_CLIENT_KEY) return;
    const s = document.createElement("script");
    s.src = "https://app.sandbox.midtrans.com/snap/snap.js"; // ganti ke production jika nanti live
    s.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
    s.async = true;
    document.body.appendChild(s);
    return () => {
      // biarkan terpasang; tidak perlu dihapus agar pay() bisa dipakai antar navigasi
    };
  }, []);

  const progress = useMemo(() => {
    if (!campaign) return 0;
    if (!campaign.target_amount || campaign.target_amount <= 0) return 0;
    return Math.min(
      100,
      Math.round((campaign.raised_amount / campaign.target_amount) * 100)
    );
  }, [campaign]);

  const valid = useMemo(() => {
    const emailOk = /\S+@\S+\.\S+/.test(email);
    const nameOk = anonymous ? true : name.trim().length > 1;
    return amount >= 5000 && emailOk && nameOk;
  }, [amount, email, name, anonymous]);

  /* ---------- BAYAR ---------- */
  async function handlePay() {
  if (!campaign) return;
  if (!valid) return alert("Lengkapi data donasi terlebih dahulu.");
  if (!MIDTRANS_CLIENT_KEY) return alert("VITE_MIDTRANS_CLIENT_KEY belum diset.");

  setSubmitting(true);
  try {
    // 1) catat donasi pending
    const { data: inserted, error: insertErr } = await supabase
      .from("donations")
      .insert({
        campaign_id: campaign.id,
        amount,
        donor_name: anonymous ? null : name,
        donor_email: email || null,
        donor_phone: phone || null,
        is_anonymous: anonymous,
        message: message || null,
        channel,
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (insertErr || !inserted?.id) {
      console.error(insertErr);
      alert("Gagal membuat donasi. Coba lagi ya.");
      setSubmitting(false);
      return;
    }

    const donation_id = inserted.id as string;
    setCreatedRef(donation_id);

    const { data, error } = await supabase.functions.invoke("checkout", {
  body: {
    order_id: donation_id, // ⚠️ penting: samakan dgn donations.id
    amount,
    channel,
    donor: { name, email, phone, is_anonymous: anonymous, note: message },
    campaign_id: campaign.id,
  },
});

console.log("invoke checkout result =>", { data, error });

if (error) {
  alert(`Gagal membuat pembayaran.\n${error.message || "Unknown error"}`);
  setSubmitting(false);
  return;
}

const token = (data && (data.token || data.snap_token)) || undefined;
const orderId = data?.order_id || donation_id; // fallback ke id yang kita buat
const redirect_url = data?.redirect_url || data?.redirectUrl;

if (window.snap?.pay && token) {
  window.snap.pay(token, {
    onSuccess: () => navigate(`/donate/success?ref=${orderId}&slug=${campaign.slug}`),
    onPending: () => navigate(`/donate/success?ref=${orderId}&pending=1&slug=${campaign.slug}`),
    onError: () => navigate(`/donate/failed?ref=${orderId}&slug=${campaign.slug}`),
    onClose: () => setSubmitting(false),
  });
} else if (redirect_url) {
  window.location.href = redirect_url;
} else {
  alert("Snap.js belum termuat. Coba refresh halaman.");
}

  } catch (e) {
    console.error(e);
    alert("Terjadi kesalahan koneksi.");
  } finally {
    setSubmitting(false);
  }
}

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <section className="container-app py-16">
        <div className="grid lg:grid-cols-[1fr,420px] gap-8">
          <div className="rounded-2xl border p-6 shadow-sm animate-pulse h-[540px]" />
          <div className="rounded-2xl border p-6 shadow-sm animate-pulse h-[420px]" />
        </div>
      </section>
    );
  }

  if (!campaign) {
    return (
      <section className="container-app py-24 text-center">
        <h1 className="text-2xl font-semibold">Campaign tidak ditemukan</h1>
        <p className="mt-1 text-gray-600">Slug: {slug}</p>
        <button
          onClick={() => navigate(-1)}
          className="btn-primary mt-6 px-6 py-2 rounded-xl"
        >
          Kembali
        </button>
      </section>
    );
  }

  return (
    <>
      <Header />
    <section className="container-app py-10">
      <div className="mb-6">
        <Link
          to={`/campaign/${campaign.slug}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Kembali ke campaign
        </Link>
        <h1 className="mt-2 text-3xl font-serif font-bold">
          Donasi untuk: {campaign.title}
        </h1>
      </div>

      <div className="grid lg:grid-cols-[1fr,420px] gap-8">
        {/* LEFT: form (no onSubmit) */}
        <div className="rounded-2xl border shadow-sm bg-white p-6 lg:p-8">
          {/* Nominal */}
          <div className="mb-6">
            <label className="block text-sm font-medium">Nominal donasi</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {presets.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAmount(n)}
                  className={`px-4 py-2 rounded-xl border transition ${
                    amount === n
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {formatIDR(n)}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-1">
                Atau masukkan nominal lain
              </div>
              <CurrencyField
                value={amount}
                onChange={setAmount}
                placeholder="Contoh: 150.000"
              />
              <p className="text-xs text-gray-500 mt-1">Minimal Rp 5.000</p>
            </div>
          </div>

          {/* Data Donatur */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Data donatur</label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  type="checkbox"
                  className="rounded border-gray-300"
                />
                Sembunyikan nama (anonim)
              </label>
            </div>

            {!anonymous && (
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <TextField
                  label="Nama lengkap"
                  value={name}
                  onChange={setName}
                />
                <TextField
                  label="Telepon (opsional)"
                  value={phone}
                  onChange={setPhone}
                />
              </div>
            )}
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <TextField
                label="Email"
                value={email}
                onChange={setEmail}
                type="email"
              />
              <TextField
                label="Catatan (opsional)"
                value={message}
                onChange={setMessage}
                placeholder="Doa/dukungan"
              />
            </div>
          </div>

          {/* Channel */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              Metode pembayaran
            </label>
            <div className="grid sm:grid-cols-3 gap-3">
              <MethodCard
                active={channel === "qris"}
                onClick={() => setChannel("qris")}
                title="QRIS"
                desc="Scan semua e-wallet"
              />
              <MethodCard
                active={channel === "ewallet"}
                onClick={() => setChannel("ewallet")}
                title="E-Wallet"
                desc="OVO/DANA/GoPay"
              />
              <MethodCard
                active={channel === "bank"}
                onClick={() => setChannel("bank")}
                title="Transfer Bank"
                desc="Virtual Account"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!valid || submitting}
              onClick={handlePay}
              className="btn-primary px-6 py-3 rounded-xl disabled:opacity-60"
            >
              {submitting ? "Memproses..." : "Lanjutkan Pembayaran"}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn px-6 py-3 rounded-xl hover:bg-gray-50"
            >
              Batal
            </button>
          </div>

          {/* Notifikasi setelah insert */}
          {createdRef && (
            <div className="mt-6 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
              <div className="font-medium text-emerald-800">
                Donasi kamu berhasil dibuat 🎉
              </div>
              <p className="text-sm text-emerald-700 mt-1">
                Kode referensi: <span className="font-mono">{createdRef}</span>.
                Lanjutkan pembayaran pada popup Snap. Setelah dibayar, status
                akan menjadi <b>berhasil</b>.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: summary */}
        <aside className="lg:pt-2">
          <div className="rounded-2xl overflow-hidden border shadow-sm bg-white">
            <div className="relative">
              <img
                src={
                  campaign.hero_image_url?.startsWith("http")
                    ? campaign.hero_image_url
                    : `https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop`
                }
                alt={campaign.title}
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-black/0">
                <div className="text-white font-medium line-clamp-2">
                  {campaign.title}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="mt-2 h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-brand-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>{progress}%</span>
                <span>100%</span>
              </div>

              <div className="mt-4 space-y-1">
                <div className="text-2xl font-bold">
                  {formatIDR(campaign.raised_amount)}
                </div>
                <div className="text-sm text-gray-500">
                  dari {formatIDR(campaign.target_amount)}
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 ring-1 ring-gray-200">
                <div className="flex items-center justify-between">
                  <span>Nominal yang dipilih</span>
                  <span className="font-medium">{formatIDR(amount || 0)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Biaya platform</span>
                  <span className="font-medium">{formatIDR(0)}</span>
                </div>
                <div className="mt-2 pt-2 border-t flex items-center justify-between">
                  <span>Total dibayarkan</span>
                  <span className="font-semibold text-gray-900">
                    {formatIDR(amount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
    <Footer />
    </>
  );
}

/* ---------- kecil2 ---------- */
function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
      />
    </label>
  );
}

function CurrencyField({
  value,
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(
    value ? new Intl.NumberFormat("id-ID").format(value) : ""
  );

  useEffect(() => {
    setText(value ? new Intl.NumberFormat("id-ID").format(value) : "");
  }, [value]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        Rp
      </span>
      <input
        inputMode="numeric"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          onChange(toNumber(v));
        }}
        className="pl-8 w-full rounded-xl border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
      />
    </div>
  );
}

function MethodCard({
  title,
  desc,
  active,
  onClick,
}: {
  title: string;
  desc: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition shadow-sm hover:shadow ${
        active
          ? "ring-2 ring-brand-primary border-brand-primary/30"
          : "border-gray-200"
      }`}
    >
      <div className="font-medium">{title}</div>
      <div className="text-xs text-gray-500">{desc}</div>
    </button>
  );
}
