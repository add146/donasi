import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  FiHeart,
  FiTarget,
  FiUsers,
  FiShield,
  FiCheckCircle,
  FiAward,
  FiGlobe,
  FiChevronRight,
  FiArrowRight,
} from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/** Normalisasi link Dropbox share -> direct download (agar kompatibel viewer Office) */
function toDirectLink(u: string) {
  try {
    const url = new URL(u);
    if (url.hostname.includes("dropbox.com")) {
      url.hostname = "dl.dropboxusercontent.com";
      url.searchParams.delete("st");
      if (!url.searchParams.has("dl")) url.searchParams.set("dl", "1");
    }
    return url.toString();
  } catch {
    return u;
  }
}

/** Map nama ikon dari admin -> komponen ikon */
const ICONS = {
  FiHeart,
  FiTarget,
  FiUsers,
  FiShield,
  FiCheckCircle,
  FiAward,
  FiGlobe,
} as const;

function renderIcon(name?: string, className?: string) {
  const Comp = name && (ICONS as any)[name];
  if (Comp) return <Comp className={className} />;
  return null;
}

type AnyObj = Record<string, any>;

export default function About() {
  const [about, setAbout] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);

  // Ambil seluruh objek "about" dari Supabase
  useEffect(() => {
    (async () => {
      const { data: row } = await supabase
        .from("site_content")
        .select("data")
        .eq("key", "about")
        .maybeSingle();
      setAbout((row?.data as AnyObj) ?? null);
      setLoading(false);
    })();
  }, []);

  // Media timeline (PPT) + gambar CTA kanan
  const pptUrl = about?.timeline?.media?.pptUrl?.trim() || "";
  const pptCaption = about?.timeline?.media?.caption || "GRAHA KITA Presentation";
  const ctaImage = about?.cta?.image?.trim() || "";

  const normalized = pptUrl ? toDirectLink(pptUrl) : "";
  const OFFICE_EMBED = normalized
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(normalized)}`
    : "";

  // ==== Fallback konten kalau belum ada data di DB ====
  const fallback = useMemo(
    () => ({
      hero: {
        visible: true,
        badge: "GRAHA KITA • Gerak Bareng Untuk Sesama",
        title: "Mewujudkan kemandirian dan kesetaraan bagi penyandang disabilitas di Indonesia.",
        subtitle:
          "Kami mempertemukan niat baik donatur dengan kebutuhan nyata di lapangan—secara aman, cepat, dan transparan. Setiap rupiah adalah jembatan harapan menuju hidup yang lebih mandiri dan bermartabat.",
        bgImage: null,
      },
      stats: {
        visible: true,
        items: [
          { label: "Penerima Manfaat", value: "12.300+ orang", icon: "FiUsers", visible: true },
          { label: "Jangkauan Program", value: "22+ kota/kab.", icon: "FiGlobe", visible: true },
          { label: "Akuntabilitas", value: "Audit & transparansi", icon: "FiShield", visible: true },
        ],
      },
      mission: {
        visible: true,
        left: {
          badge: "Visi",
          title: "Masyarakat yang setara & inklusif",
          icon: "FiTarget",
          desc:
            "Kami membayangkan Indonesia yang inklusif, di mana penyandang disabilitas memiliki akses, kesempatan, serta dukungan untuk mewujudkan kemandirian.",
          visible: true,
        },
        right: {
          badge: "Misi",
          title: "Menghubungkan kebaikan dengan dampak nyata",
          icon: "FiCheckCircle",
          desc:
            "Mendistribusikan donasi secara tepat sasaran melalui program pendidikan, kesehatan, ekonomi, dan alat bantu, sambil menjaga transparansi dan keamanan.",
          visible: true,
        },
      },
      values: {
        visible: true,
        items: [
          { title: "Integritas", desc: "Menjunjung tanggung jawab & transparansi pada setiap proses.", icon: "FiShield" },
          { title: "Empati", desc: "Mengutamakan martabat & kebutuhan penerima manfaat.", icon: "FiHeart" },
          { title: "Profesional", desc: "Eksekusi rapi, laporan jelas, audit & compliance terjaga.", icon: "FiAward" },
          { title: "Kolaborasi", desc: "Bersinergi dengan mitra, relawan, dan komunitas lokal.", icon: "FiUsers" },
        ],
      },
      timeline: {
        visible: true,
        items: [
          { year: "2021", title: "Mulai dari komunitas", desc: "Program rintisan alat bantu & kelas keterampilan kecil." },
          { year: "2022", title: "Legal & tata kelola", desc: "Penyempurnaan SOP, pelaporan berkala, & kanal donasi digital." },
          { year: "2023", title: "Ekspansi program", desc: "Menjangkau lebih banyak wilayah bersama mitra lokal." },
          { year: "2024", title: "Pelibatan mitra korporasi", desc: "Kemitraan berkelanjutan & audit independen." },
        ],
      },
      team: {
        visible: true,
        items: [
          {
            name: "Rahma S.",
            role: "Program Lead",
            img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=900&auto=format&fit=crop",
            visible: true,
          },
          {
            name: "Dimas A.",
            role: "Partnership",
            img: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=900&auto=format&fit=crop",
            visible: true,
          },
          {
            name: "Intan P.",
            role: "Finance & Reporting",
            img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=900&auto=format&fit=crop",
            visible: true,
          },
        ],
      },
      cta: {
        visible: true,
        title: "Jadikan kebaikan sebagai strategi brand Anda.",
        subtitle:
          "Hubungi kami untuk paket kemitraan, CSR, atau sponsor program. Kami siapkan eksekusi dan laporan dampak yang transparan.",
        primaryText: "Lihat Paket Kemitraan",
        primaryHref: "/kemitraan",
        secondaryText: "Donasi Sekarang",
        secondaryHref: "/#campaigns",
        image:
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1200&auto=format&fit=crop",
      },
    }),
    []
  );

  // gabungkan data DB dengan fallback (non destructive)
  const data: AnyObj = useMemo(() => {
    if (!about) return fallback;
    return {
      hero: { ...fallback.hero, ...(about.hero || {}) },
      stats: { ...fallback.stats, ...(about.stats || {}) },
      mission: { ...fallback.mission, ...(about.mission || {}) },
      values: { ...fallback.values, ...(about.values || {}) },
      timeline: { ...fallback.timeline, ...(about.timeline || {}) },
      team: { ...fallback.team, ...(about.team || {}) },
      cta: { ...fallback.cta, ...(about.cta || {}) },
    };
  }, [about, fallback]);

  return (
    <>
      <Header />

      {/* HERO */}
      {data.hero?.visible !== false && (
        <section id="about" className="relative overflow-hidden" aria-labelledby="about-hero-title">
          {/* Background */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-slate-50 to-white"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(34rem 18rem at 10% -5%, rgba(250,204,21,.18), transparent 60%), radial-gradient(42rem 24rem at 90% 10%, rgba(16,185,129,.14), transparent 60%)",
            }}
          />
          {data.hero.bgImage ? (
            <img
              src={String(data.hero.bgImage)}
              alt=""
              className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20"
            />
          ) : null}

          <div className="container-app py-16 md:py-24">
            <div className="max-w-3xl">
              {data.hero.badge ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/70 px-3 py-1 text-[11px] font-medium text-amber-700">
                  <FiHeart className="h-4 w-4" />
                  {data.hero.badge}
                </span>
              ) : null}

              <h1 id="about-hero-title" className="mt-4 text-4xl md:text-5xl font-serif font-extrabold tracking-tight">
                {data.hero.title}
              </h1>
              {data.hero.subtitle ? (
                <p className="mt-4 text-slate-600 text-lg leading-relaxed">{data.hero.subtitle}</p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#misi"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold ring-1 ring-emerald-500 transition hover:bg-emerald-700 hover:shadow-md"
                >
                  Lihat Misi Kami <FiArrowRight className="h-5 w-5" />
                </a>
                <a
                  href="#kontak"
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-slate-700 transition hover:bg-white hover:shadow-sm"
                >
                  Hubungi Kami <FiChevronRight className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* highlight cards */}
            {data.stats?.visible !== false && (
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(data.stats.items || [])
                  .filter((s: AnyObj) => s?.visible !== false)
                  .slice(0, 6)
                  .map((s: AnyObj, i: number) => (
                    <StatCard
                      key={i}
                      icon={
                        renderIcon(s.icon, "") ??
                        // fallback ikon berdasarkan label
                        (s.label?.toLowerCase().includes("jangkau") ? <FiGlobe /> :
                         s.label?.toLowerCase().includes("akun") ? <FiShield /> :
                         <FiUsers />)
                      }
                      label={s.label || "-"}
                      value={s.value || "-"}
                    />
                  ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* MISI & VISI */}
      {data.mission?.visible !== false && (
        <section id="misi" className="py-14 md:py-20">
          <div className="container-app">
            <div className="grid gap-6 lg:grid-cols-2">
              {data.mission?.left?.visible !== false && (
                <InfoCard
                  badge={data.mission.left.badge}
                  title={data.mission.left.title}
                  icon={
                    renderIcon(data.mission.left.icon, "text-emerald-600") || <FiTarget className="text-emerald-600" />
                  }
                  desc={data.mission.left.desc}
                />
              )}
              {data.mission?.right?.visible !== false && (
                <InfoCard
                  badge={data.mission.right.badge}
                  title={data.mission.right.title}
                  icon={
                    renderIcon(data.mission.right.icon, "text-emerald-600") ||
                    <FiCheckCircle className="text-emerald-600" />
                  }
                  desc={data.mission.right.desc}
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* NILAI-NILAI */}
      {data.values?.visible !== false && (
        <section className="py-12 md:py-16">
          <div className="container-app">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-serif font-bold tracking-tight">Nilai yang kami pegang</h2>
              <p className="mt-3 text-slate-600">
                Fondasi budaya kerja kami untuk memastikan bantuan tersalurkan dengan tepat, terhormat, dan berkelanjutan.
              </p>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(data.values.items || []).map((v: AnyObj, i: number) => (
                <ValueCard
                  key={i}
                  icon={
                    renderIcon(v.icon, "") ||
                    // fallback ikon ringan
                    <FiAward />
                  }
                  title={v.title || "-"}
                >
                  {v.desc || ""}
                </ValueCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TIMELINE / PERJALANAN */}
      {data.timeline?.visible !== false && (
        <section className="py-14 md:py-20">
          <div className="container-app">
            <div className="grid lg:grid-cols-[1fr,1.2fr] gap-10 items-start">
              <div>
                <h2 className="text-3xl font-serif font-bold tracking-tight">Perjalanan singkat kami</h2>
                <p className="mt-3 text-slate-600">
                  Kebaikan ini tumbuh dari inisiatif, berkembang menjadi gerakan kolaboratif yang berdampak luas.
                </p>

                <ul className="mt-6 space-y-6">
                  {(data.timeline.items || []).map((t: AnyObj, i: number) => (
                    <TimelineItem key={`${t.year}-${i}`} year={t.year || ""} title={t.title || ""}>
                      {t.desc || ""}
                    </TimelineItem>
                  ))}
                </ul>
              </div>

              {/* Kolom kanan: jika ada PPT -> tampilkan viewer, jika tidak fallback ke gambar */}
              <div className="relative overflow-hidden rounded-3xl border bg-white shadow-sm">
                {OFFICE_EMBED ? (
                  <>
                    <iframe
                      title="Presentasi (PPT)"
                      src={OFFICE_EMBED}
                      className="w-full h-72 md:h-[28rem]"
                      frameBorder={0}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="rounded-2xl bg-white/85 backdrop-blur ring-1 ring-amber-200 p-4">
                        <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">{pptCaption}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-40"
                      style={{
                        background:
                          "radial-gradient(40rem 16rem at 20% -10%, rgba(250,204,21,.08), transparent 60%)",
                      }}
                    />
                    <img
                      src="https://images.unsplash.com/photo-1526253038957-bce54b58f5bf?q=80&w=1400&auto=format&fit=crop"
                      alt="Kegiatan pendampingan masyarakat"
                      className="h-72 md:h-[28rem] w-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="rounded-2xl bg-white/85 backdrop-blur ring-1 ring-amber-200 p-4">
                        <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                          Dokumentasi kegiatan lapangan (ilustrasi)
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TEAM (teaser) */}
      {data.team?.visible !== false && (
        <section className="py-12 md:py-16">
          <div className="container-app">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-serif font-bold tracking-tight">Tim kecil, hati besar</h2>
                <p className="mt-2 text-slate-600">Didukung relawan & mitra profesional, melayani sesuai prosedur.</p>
              </div>
              <a
                href="#kontak"
                className="hidden md:inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm hover:bg-white hover:shadow-sm"
              >
                Kolaborasi <FiChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(data.team.items || [])
                .filter((m: AnyObj) => m?.visible !== false)
                .map((m: AnyObj, i: number) => (
                  <TeamCard key={i} name={m.name || "-"} role={m.role || ""} img={m.img || ""} />
                ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA BOTTOM */}
      {data.cta?.visible !== false && (
        <section id="kontak" className="py-14 md:py-20">
          <div className="container-app">
            <div className="overflow-hidden rounded-3xl border bg-white shadow-md">
              <div className="grid md:grid-cols-[1.4fr,1fr]">
                <div className="p-8 md:p-10">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                    <FiAward className="h-4 w-4" />
                    Ajak tim Anda berkolaborasi
                  </span>
                  <h3 className="mt-3 text-2xl md:text-3xl font-serif font-bold">{data.cta.title}</h3>
                  {data.cta.subtitle ? <p className="mt-3 text-slate-600">{data.cta.subtitle}</p> : null}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a href={data.cta.primaryHref || "#"} className="btn-accent rounded-xl px-5 py-3 text-white font-semibold">
                      {data.cta.primaryText || "Lihat Paket Kemitraan"}
                    </a>
                    {data.cta.secondaryText && data.cta.secondaryHref ? (
                      <a
                        href={data.cta.secondaryHref}
                        className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 hover:bg-white hover:shadow-sm"
                      >
                        {data.cta.secondaryText} <FiArrowRight />
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="relative min-h-[220px] md:min-h-[280px]">
                  <img
                    src={
                      ctaImage ||
                      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1200&auto=format&fit=crop"
                    }
                    alt="Kolaborasi kemitraan"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}

/* === Subcomponents === */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        {icon}
      </div>
      <div className="text-[13px] text-slate-500">{label}</div>
      <div className="text-lg font-semibold tracking-tight">{value}</div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(42rem 14rem at 20% -10%, rgba(250,204,21,.07), transparent 60%)",
        }}
      />
    </div>
  );
}

function InfoCard({
  badge,
  title,
  icon,
  desc,
}: {
  badge: string;
  title: string;
  icon: React.ReactNode;
  desc: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border bg-white p-6 md:p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200">
          {icon}
        </div>
        <div className="min-w-0">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            {badge}
          </span>
          <h3 className="mt-1 text-xl md:text-2xl font-serif font-bold tracking-tight">{title}</h3>
          <p className="mt-2 text-slate-600">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        {icon}
      </div>
      <h4 className="text-lg font-semibold tracking-tight">{title}</h4>
      <p className="mt-2 text-slate-600 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function TimelineItem({
  year,
  title,
  children,
}: {
  year: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="relative pl-8">
      <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-amber-400 ring-8 ring-amber-100" />
      <div className="text-sm text-slate-500">{year}</div>
      <div className="text-base font-semibold tracking-tight">{title}</div>
      <p className="mt-1 text-slate-600 text-sm">{children}</p>
    </li>
  );
}

function TeamCard({
  name,
  role,
  img,
}: {
  name: string;
  role: string;
  img: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <img src={img} alt={name} className="h-48 w-full object-cover" />
      <div className="p-4">
        <div className="text-base font-semibold tracking-tight">{name}</div>
        <div className="text-sm text-slate-500">{role}</div>
      </div>
    </div>
  );
}
