// src/pages/Contact.tsx
import { useEffect, useState } from "react";
import { FiMail, FiPhone, FiMapPin, FiMessageCircle, FiClock, FiArrowRight } from "react-icons/fi";
import { supabase } from "../lib/supabase";
import { ensurePublicUrl } from "../lib/uploadPublic";
import type { ContactPageContent } from "../types/siteContent";

// Header & Footer publik
import Header from "../components/Header";
import Footer from "../components/Footer";

const DEFAULT_CONTACT: ContactPageContent = {
  hero: {
    title: "Hubungi Kami",
    subtitle: "Kami siap membantu kolaborasi & pertanyaan Anda.",
    bgImage: null,
    visible: true,
  },
  methods: {
    visible: true,
    items: [
      { type: "whatsapp", label: "WhatsApp", value: "0812-xxxx-xxxx", href: "https://wa.me/62812xxxxxxx" },
      { type: "email", label: "Email", value: "halo@grahakita.id", href: "mailto:halo@grahakita.id" },
      { type: "address", label: "Alamat", value: "Jl. Contoh No. 1, Jakarta" },
    ],
  },
  hours: {
    visible: true,
    days: [
      { label: "Sen–Jum", value: "09.00–17.00" },
      { label: "Sab", value: "10.00–14.00" },
    ],
    note: "Di luar jam kerja, balasan mungkin lebih lambat.",
  },
  map: { visible: true, embedUrl: "" },
  cta: {
    visible: true,
    title: "Ingin Kerja Sama?",
    subtitle: "Daftarkan lembaga Anda dalam program kemitraan.",
    buttonText: "Ajukan Kemitraan",
    href: "/kemitraan",
  },
};

function IconFor(type?: string) {
  switch ((type || "").toLowerCase()) {
    case "whatsapp":
      return <FiMessageCircle className="h-5 w-5" aria-hidden />;
    case "email":
      return <FiMail className="h-5 w-5" aria-hidden />;
    case "phone":
      return <FiPhone className="h-5 w-5" aria-hidden />;
    case "address":
      return <FiMapPin className="h-5 w-5" aria-hidden />;
    default:
      return <FiArrowRight className="h-5 w-5" aria-hidden />;
  }
}

export default function Contact() {
  const [data, setData] = useState<ContactPageContent>(DEFAULT_CONTACT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("site_content")
        .select("data")
        .eq("key", "contact")
        .maybeSingle();

      if (!mounted) return;
      const d = (data?.data as ContactPageContent) || DEFAULT_CONTACT;

      setData({
        hero: {
          title: d.hero?.title || DEFAULT_CONTACT.hero.title,
          subtitle: d.hero?.subtitle || DEFAULT_CONTACT.hero.subtitle,
          bgImage: d.hero?.bgImage || null,
          visible: d.hero?.visible ?? true,
        },
        methods: {
          visible: d.methods?.visible ?? true,
          items: d.methods?.items || DEFAULT_CONTACT.methods.items,
        },
        hours: d.hours ?? DEFAULT_CONTACT.hours,
        map: d.map ?? DEFAULT_CONTACT.map,
        cta: d.cta ?? DEFAULT_CONTACT.cta,
      });
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const heroBg = data.hero?.bgImage ? ensurePublicUrl(data.hero.bgImage) : null;

  return (
    <>
      <Header />

      <main className="bg-white">
        {/* HERO */}
        {data.hero?.visible !== false && (
          <section className="relative overflow-hidden">
            {/* background */}
            {heroBg ? (
              <div
                className="absolute inset-0 -z-10 bg-center bg-cover"
                style={{ backgroundImage: `url('${heroBg}')` }}
                aria-hidden="true"
              />
            ) : (
              <div
                className="absolute inset-0 -z-10"
                aria-hidden="true"
                style={{
                  background:
                    "radial-gradient(40rem 18rem at 20% -5%, rgba(16,185,129,.12), transparent 60%), radial-gradient(36rem 20rem at 90% 15%, rgba(234,179,8,.12), transparent 60%), linear-gradient(180deg,#fff,#f8fafc)",
                }}
              />
            )}
            {/* overlay */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/40 via-white/10 to-white" aria-hidden />

            <div className="container-app py-16 md:py-24">
              <header className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/60 px-3 py-1 text-[11px] font-medium text-emerald-700">
                  <FiMessageCircle className="h-4 w-4" />
                  Tim Kami Siaga
                </span>
                <h1 className="mt-3 text-4xl md:text-5xl font-serif font-bold tracking-tight">
                  {data.hero?.title}
                </h1>
                {data.hero?.subtitle ? (
                  <p className="mt-3 text-[15px] md:text-base text-slate-600">{data.hero.subtitle}</p>
                ) : null}
              </header>
            </div>
          </section>
        )}

        {/* CONTENT */}
        <section className="py-12 md:py-16">
          <div className="container-app grid gap-10 lg:grid-cols-[minmax(0,1fr),420px]">
            {/* LEFT: methods + hours */}
            <div className="space-y-8">
              {/* METHODS */}
              {data.methods?.visible !== false && (
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <FiMessageCircle className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Hubungi Kami</h2>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {loading &&
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-white p-4 animate-pulse">
                          <div className="h-4 w-1/2 bg-slate-200 rounded" />
                          <div className="mt-2 h-4 w-2/3 bg-slate-200 rounded" />
                        </div>
                      ))}

                    {!loading &&
                      (data.methods?.items || []).map((it, i) => {
                        const href = it.href?.trim();
                        const isExternal = !!href && /^https?:/i.test(href);
                        return (
                          <div
                            key={i}
                            className="group relative rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-slate-100">
                                {IconFor(it.type)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-slate-900">{it.label}</div>
                                <div className="truncate text-sm text-slate-600">{it.value}</div>
                                {href ? (
                                  <a
                                    href={href}
                                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
                                    target={isExternal ? "_blank" : undefined}
                                    rel={isExternal ? "noreferrer" : undefined}
                                  >
                                    Hubungi
                                    <FiArrowRight className="h-4 w-4" />
                                  </a>
                                ) : null}
                              </div>
                            </div>

                            {/* subtle highlight */}
                            <div
                              aria-hidden
                              className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                              style={{
                                background:
                                  "radial-gradient(40rem 14rem at 20% -10%, rgba(16,185,129,.06), transparent 60%)",
                              }}
                            />
                          </div>
                        );
                      })}

                    {!loading && (data.methods?.items || []).length === 0 && (
                      <div className="text-sm text-slate-500">Belum ada metode kontak.</div>
                    )}
                  </div>
                </div>
              )}

              {/* HOURS */}
              {data.hours?.visible !== false && (
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                      <FiClock className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Jam Operasional</h2>
                  </div>

                  <div className="mt-5 space-y-2">
                    {(data.hours?.days || []).map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <span className="text-sm font-medium text-slate-700">{d.label}</span>
                        <span className="text-sm text-slate-700">{d.value}</span>
                      </div>
                    ))}
                    {data.hours?.note ? (
                      <p className="text-xs text-slate-500">{data.hours.note}</p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: map */}
            {data.map?.visible !== false && (
              <aside className="lg:sticky lg:top-24 space-y-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {data.map?.embedUrl ? (
                    <iframe
                      title="Lokasi"
                      src={data.map.embedUrl}
                      className="w-full h-[300px] md:h-[420px]"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="grid h-[300px] md:h-[420px] place-items-center text-slate-400">
                      <div className="text-sm">Belum ada peta</div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <FiMapPin className="h-4 w-4" />
                    Alamat Kami
                  </div>
                  <p className="mt-1">
                    {(data.methods?.items || []).find((m) => m.type === "address")?.value ||
                      "—"}
                  </p>
                </div>
              </aside>
            )}
          </div>
        </section>

        {/* CTA */}
        {data.cta?.visible !== false && (
          <section className="py-10 md:py-14">
            <div className="container-app">
              <div className="grid gap-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-amber-50 p-6 md:p-8 md:grid-cols-[1fr,auto] items-center shadow-sm">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">{data.cta?.title}</h3>
                  {data.cta?.subtitle ? (
                    <p className="mt-1 text-slate-700">{data.cta.subtitle}</p>
                  ) : null}
                </div>
                <div>
                  <a
                    href={data.cta?.href || "#"}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white ring-1 ring-emerald-500/60 transition hover:bg-emerald-700"
                  >
                    {data.cta?.buttonText || "Ajukan Kemitraan"}
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
