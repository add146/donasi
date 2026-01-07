// src/pages/admin/SettingsAdmin.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { HeaderContent, HeroContent } from "../../types/siteContent";
import { uploadPublicImage, ensurePublicUrl } from "../../lib/uploadPublic";
import type {
  ImpactContent,
  FooterContent, FooterLink,
  PaymentsContent, BankAccount, EWallet
} from "../../types/siteContent";
import type { PartnersContent, PartnerLogo } from "../../types/siteContent";
import { DEFAULT_PARTNERS } from "../../types/siteContent";
import { uploadPublicFile } from "../../lib/uploadPublic"; // untuk PDF deck
import type { ContactPageContent } from "../../types/siteContent";


type SiteContentRow = { key: string; data: any };

async function fetchContent<T = any>(key: string): Promise<T | null> {
  const { data } = await supabase
    .from("site_content")
    .select("data")
    .eq("key", key)
    .maybeSingle();
  return (data?.data as T) ?? null;
}

async function upsertContent(key: string, data: any) {
  const payload: SiteContentRow = { key, data };
  const { error } = await supabase
    .from("site_content")
    .upsert(payload, { onConflict: "key" });
  if (error) throw error;
}

type TabKey = "header" | "hero" | "impact" | "footer" | "payments" | "partnership" | "contact" | "seo";

export default function SettingsAdmin() {
  const [activeTab, setActiveTab] = useState<TabKey>("header");

  /** HEADER STATE */
  const [headerLoading, setHeaderLoading] = useState(true);
  const [headerSaving, setHeaderSaving] = useState(false);
  const [header, setHeader] = useState<HeaderContent>({
    title: "",
    logo: null,
    useLogo: false,
  });
  const logoUrl = ensurePublicUrl(header.logo) ?? undefined;
  const [logoExt, setLogoExt] = useState<string>("");

  /** HERO STATE */
  const [heroLoading, setHeroLoading] = useState(true);
  const [heroSaving, setHeroSaving] = useState(false);
  const [hero, setHero] = useState<HeroContent>({
    headline: "",
    subheadline: "",
    ctaText: "",
    ctaHref: "",
    bgImage: null,
  });
  const [extUrl, setExtUrl] = useState<string>("");

  /** IMPACT STATE */
  const [impactLoading, setImpactLoading] = useState(true);
  const [impactSaving, setImpactSaving] = useState(false);
  const [impact, setImpact] = useState<ImpactContent>({
    fundRaised: 0,
    donors: 0,
    beneficiaries: 0,
  });

  /** FOOTER STATE */
  const [footerLoading, setFooterLoading] = useState(true);
  const [footerSaving, setFooterSaving] = useState(false);
  const [footer, setFooter] = useState<FooterContent>({
    siteName: "Asa Bersama",
    description:
      "Yayasan non-profit yang berdedikasi untuk menciptakan kesetaraan dan kemandirian bagi penyandang disabilitas di Indonesia.",
    skNumber: "AHU-12345.AH.01.04.Tahun 2024",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Transparansi Laporan", href: "/#transparansi" },
      { label: "Syarat & Ketentuan", href: "/#terms" },
      { label: "Kebijakan Privasi", href: "/#privacy" },
    ],
    contact: {
      address: "Jl. Harapan Raya No. 123, Jakarta Selatan, Indonesia",
      email: "info@asabersama.org",
      whatsapp: "",
      phone: "",
    },
    mapEmbedUrl: "",
    social: {
      instagram: "",
      facebook: "",
      youtube: "",
      tiktok: "",
      whatsapp: "",
    },
  });

  // PAYMENTS STATE
  const [payLoading, setPayLoading] = useState(true);
  const [paySaving, setPaySaving] = useState(false);
  const [payments, setPayments] = useState<PaymentsContent>({
    instructions: "",
    banks: [],
    ewallets: [],
  });

  /** PARTNERSHIP STATE */
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnersSaving, setPartnersSaving] = useState(false);
  const [partners, setPartners] = useState<PartnersContent>(DEFAULT_PARTNERS);

  // ⬇ STATE KONTAK
const [contactLoading, setContactLoading] = useState(true);
const [contactSaving, setContactSaving] = useState(false);
const [contactExtBg, setContactExtBg] = useState<string>("");

const [contact, setContact] = useState<ContactPageContent>({
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
    note: "Diluar jam kerja, balasan mungkin lebih lambat.",
  },
  map: {
    visible: true,
    embedUrl: "",
  },
  cta: {
    visible: true,
    title: "Ingin Kerja Sama?",
    subtitle: "Daftarkan lembaga Anda dalam program kemitraan.",
    buttonText: "Ajukan Kemitraan",
    href: "/kemitraan",
  },
});

    // Default & helper utk memastikan semua properti CTA selalu ada
const CTA_DEFAULT: Required<ContactPageContent["cta"]> = {
  title: "",
  subtitle: "",
  buttonText: "",
  href: "",
  visible: true,
};
const withCta = (cta?: ContactPageContent["cta"]) => ({ ...CTA_DEFAULT, ...(cta ?? {}) });

/** ========== SEO STATE (GLOBAL & PER-PAGE) ========== */
type AdminSeoSettings = {
  siteTitle?: string;
  siteDescription?: string;
  siteUrl?: string;
  defaultOgImage?: string | null;
  locale?: string;
  themeColor?: string;
  social?: { twitter?: string; facebook?: string; instagram?: string };
};

type AdminSeoPage = {
  path: string;              // ex: "/", "/tentang-kami", "/p/slug", "/campaign/slug"
  title?: string | null;
  description?: string | null;
  image?: string | null;
  noindex?: boolean;
};

const [seoLoading, setSeoLoading] = useState(true);
const [seoSaving, setSeoSaving] = useState(false);
const [seoBuildState, setSeoBuildState] = useState<"idle" | "posting" | "done" | "error">("idle");

const [seoSettings, setSeoSettings] = useState<AdminSeoSettings>({
  siteTitle: "Graha Kita – Donasi Al-Qur’an & Kegiatan Sosial",
  siteDescription:
    "Bantu sebarkan Al-Qur’an dan salurkan bantuan kemanusiaan bersama Graha Kita. Donasi mudah, transparan, berdampak nyata.",
  siteUrl: "https://www.grahakita.id",
  defaultOgImage: null,
  locale: "id_ID",
  themeColor: "#0ea5e9",
  social: {},
});

const [seoPages, setSeoPages] = useState<AdminSeoPage[]>([]);

// Upload OG image ke storage (gunakan helper uploadPublicImage yang sudah kamu pakai)
async function handleUploadSeoOg(file?: File | null) {
  if (!file) return;
  const url = await uploadPublicImage(file, "seo");
  setSeoSettings((v) => ({ ...v, defaultOgImage: ensurePublicUrl(url) }));
}

// CRUD per-page entries
function addSeoPage() {
  setSeoPages((arr) => [...arr, { path: "/", title: "", description: "", image: "", noindex: false }]);
}
function updateSeoPage(i: number, patch: Partial<AdminSeoPage>) {
  setSeoPages((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
}
function removeSeoPage(i: number) {
  setSeoPages((arr) => arr.filter((_, idx) => idx !== i));
}

// Simpan ke site_content
async function handleSaveSEO() {
  try {
    setSeoSaving(true);
    await upsertContent("seo_settings", seoSettings);
    await upsertContent("seo_pages", seoPages);
    alert("SEO settings tersimpan ✅");
  } catch (e: any) {
    console.error(e);
    alert("Gagal menyimpan SEO: " + (e?.message || e));
  } finally {
    setSeoSaving(false);
  }
}

// Trigger Netlify build (opsional, untuk regen sitemap/index.html baseline)
async function triggerNetlifyBuildSEO() {
  const hook = import.meta.env.VITE_NETLIFY_BUILD_HOOK_URL as string | undefined;
  if (!hook) {
    alert("Set env VITE_NETLIFY_BUILD_HOOK_URL agar bisa trigger deploy Netlify.");
    return;
  }
  try {
    setSeoBuildState("posting");
    const res = await fetch(hook, { method: "POST" });
    if (!res.ok) throw new Error("Build hook gagal: " + res.status);
    setSeoBuildState("done");
    alert("Deploy dipicu. Netlify akan rebuild situs 👍");
  } catch (e: any) {
    setSeoBuildState("error");
    alert("Gagal trigger deploy: " + (e?.message || e));
  } finally {
    setTimeout(() => setSeoBuildState("idle"), 1500);
  }
}

  /** LOAD SEMUA KONTEN SEKALI */
  useEffect(() => {
    (async () => {
      // header
      setHeaderLoading(true);
      const h = await fetchContent<HeaderContent>("header");
      setHeader({
        title: h?.title ?? "Asa Bersama",
        logo: h?.logo ?? null,
        useLogo: !!h?.useLogo,
      });
      setHeaderLoading(false);
      setLogoExt(
      h?.logo && /^https?:\/\//i.test(String(h.logo)) ? String(h.logo) : ""
      );

      // impact
      setImpactLoading(true);
      const im = await fetchContent<ImpactContent>("impact");
      setImpact({
        fundRaised: Number(im?.fundRaised ?? 0),
        donors: Number(im?.donors ?? 0),
        beneficiaries: Number(im?.beneficiaries ?? 0),
      });
      setImpactLoading(false);

      // hero
      setHeroLoading(true);
      const hr = await fetchContent<HeroContent>("hero");
      setHero({
        headline: hr?.headline ?? "Kebaikan Anda, Kekuatan Mereka.",
        subheadline:
          hr?.subheadline ??
          "Setiap donasi yang Anda berikan membuka pintu harapan dan kesempatan bagi saudara kita penyandang disabilitas untuk hidup mandiri dan berdaya.",
        ctaText: hr?.ctaText ?? "Bantu Mereka Sekarang",
        ctaHref: hr?.ctaHref ?? "#campaigns",
        bgImage: hr?.bgImage ?? null,
      });
      const heroBg = hr?.bgImage ?? null;
      setExtUrl(heroBg && /^https?:\/\//i.test(heroBg) ? heroBg : "");
      setHeroLoading(false);

      // footer
      setFooterLoading(true);
      const fData = await fetchContent<FooterContent>("footer");
      if (fData) setFooter(fData);
      setFooterLoading(false);

      // payments
      setPayLoading(true);
      const pData = await fetchContent<PaymentsContent>("payments");
      if (pData) setPayments({
        instructions: pData.instructions ?? "",
        banks: Array.isArray(pData.banks) ? pData.banks : [],
        ewallets: Array.isArray(pData.ewallets) ? pData.ewallets : [],
      });
      setPayLoading(false);

      // partners (teaser kemitraan)
      setPartnersLoading(true);
      {
        const p = await fetchContent<PartnersContent>("partners");
        if (p) setPartners({ ...DEFAULT_PARTNERS, ...p });
      }
      setPartnersLoading(false);

      // ⬇ load contact
      setContactLoading(true);
        const c = await fetchContent<ContactPageContent>("contact");
        if (c) {
      setContact(c);
      const bg = c.hero?.bgImage ?? "";
      setContactExtBg(bg && /^https?:\/\//i.test(bg) ? bg : "");
      }
      setContactLoading(false);

    })();
  }, []);

  /** LOAD SEO SETTINGS (terpisah agar non-intrusive) */
useEffect(() => {
  (async () => {
    try {
      setSeoLoading(true);
      const s = await fetchContent<AdminSeoSettings>("seo_settings");
      if (s) setSeoSettings((prev) => ({ ...prev, ...s }));
      const p = await fetchContent<AdminSeoPage[]>("seo_pages");
      if (p) setSeoPages(Array.isArray(p) ? p : []);
    } finally {
      setSeoLoading(false);
    }
  })();
}, []);


  /** ACTIONS: HEADER */
  async function handleUploadLogo(file?: File | null) {
    if (!file) return;
    const url = await uploadPublicImage(file, "logos");
    setHeader((v) => ({ ...v, logo: url, useLogo: true }));
  }

  async function handleSaveHeader() {
    setHeaderSaving(true);
    try {
      await upsertContent("header", header);
      alert("Pengaturan header tersimpan ✅");
    } catch (e: any) {
      console.error(e);
      alert(`Gagal menyimpan: ${e.message || e}`);
    } finally {
      setHeaderSaving(false);
    }
  }

  /** ACTIONS: IMPACT */
  async function handleSaveImpact() {
    setImpactSaving(true);
    try {
      const payload: ImpactContent = {
        fundRaised: Number(impact.fundRaised || 0),
        donors: Number(impact.donors || 0),
        beneficiaries: Number(impact.beneficiaries || 0),
      };
      await upsertContent("impact", payload);
      alert("Impact stats tersimpan ✅");
    } catch (e: any) {
      console.error(e);
      alert(`Gagal menyimpan: ${e.message || e}`);
    } finally {
      setImpactSaving(false);
    }
  }

  /** ACTIONS: HERO */
  async function handleSaveHero() {
    setHeroSaving(true);
    try {
      await upsertContent("hero", hero);
      alert("Pengaturan hero tersimpan ✅");
    } catch (e: any) {
      console.error(e);
      alert(`Gagal menyimpan: ${e.message || e}`);
    } finally {
      setHeroSaving(false);
    }
  }

  /** ACTIONS: FOOTER */
  function handleFooterLinkChange(idx: number, key: keyof FooterLink, value: string) {
    setFooter((cur) => {
      const links = [...(cur.links || [])];
      links[idx] = { ...links[idx], [key]: value };
      return { ...cur, links };
    });
  }

  function handleFooterAddLink() {
    setFooter((cur) => ({ ...cur, links: [...(cur.links || []), { label: "", href: "" }] }));
  }

  function handleFooterRemoveLink(idx: number) {
    setFooter((cur) => {
      const links = [...(cur.links || [])];
      links.splice(idx, 1);
      return { ...cur, links };
    });
  }

  async function handleSaveFooter() {
    setFooterSaving(true);
    try {
      await upsertContent("footer", footer);
      alert("Pengaturan footer tersimpan ✅");
    } catch (e: any) {
      console.error(e);
      alert(`Gagal menyimpan: ${e.message || e}`);
    } finally {
      setFooterSaving(false);
    }
  }

  // ---------- PAYMENTS HANDLERS ----------
function updateBank(idx: number, key: keyof BankAccount, val: string | boolean) {
  setPayments(cur => {
    const banks = [...cur.banks];
    banks[idx] = { ...banks[idx], [key]: val } as BankAccount;
    return { ...cur, banks };
  });
}
function addBank() {
  setPayments(cur => ({
    ...cur,
    banks: [...cur.banks, { bank: "", accountName: "", accountNumber: "", isActive: true }]
  }));
}
function removeBank(idx: number) {
  setPayments(cur => {
    const banks = [...cur.banks];
    banks.splice(idx, 1);
    return { ...cur, banks };
  });
}

function updateEw(idx: number, key: keyof EWallet, val: string | boolean | null) {
  setPayments(cur => {
    const ewallets = [...cur.ewallets];
    ewallets[idx] = { ...ewallets[idx], [key]: val } as EWallet;
    return { ...cur, ewallets };
  });
}
function addEw() {
  setPayments(cur => ({
    ...cur,
    ewallets: [...cur.ewallets, { provider: "", accountName: "", number: "", qrImage: null, isActive: true }]
  }));
}
function removeEw(idx: number) {
  setPayments(cur => {
    const ewallets = [...cur.ewallets];
    ewallets.splice(idx, 1);
    return { ...cur, ewallets };
  });
}

// ⬇ HANDLER KONTAK
async function handleUploadContactHero(file?: File | null) {
  if (!file) return;
  const url = await uploadPublicImage(file, "contact");
  setContact((cur) => ({ ...cur, hero: { ...cur.hero, bgImage: url } }));
  setContactExtBg("");
}

function addMethod() {
  setContact((cur) => ({
    ...cur,
    methods: {
      visible: cur.methods?.visible ?? true,
      items: [...(cur.methods?.items || []), { type: "custom", label: "", value: "", href: "" }],
    },
  }));
}
function updateMethod(
  idx: number,
  key: keyof ContactPageContent["methods"]["items"][number],
  value: any
) {
  setContact((cur) => {
    const arr = [...(cur.methods?.items || [])];
    arr[idx] = { ...arr[idx], [key]: value };
    return { ...cur, methods: { ...cur.methods, items: arr } };
  });
}
function removeMethod(idx: number) {
  setContact((cur) => {
    const arr = [...(cur.methods?.items || [])];
    arr.splice(idx, 1);
    return { ...cur, methods: { ...cur.methods, items: arr } };
  });
}

function addHourDay() {
  setContact((cur) => ({
    ...cur,
    hours: {
      visible: cur.hours?.visible ?? true,
      days: [...(cur.hours?.days || []), { label: "", value: "" }],
      note: cur.hours?.note || "",
    },
  }));
}
function updateHourDay(idx: number, key: "label" | "value", v: string) {
  setContact((cur) => {
    const arr = [...(cur.hours?.days || [])];
    arr[idx] = { ...arr[idx], [key]: v };
    return { ...cur, hours: { ...cur.hours!, days: arr } };
  });
}
function removeHourDay(idx: number) {
  setContact((cur) => {
    const arr = [...(cur.hours?.days || [])];
    arr.splice(idx, 1);
    return { ...cur, hours: { ...cur.hours!, days: arr } };
  });
}

async function handleSaveContact() {
  setContactSaving(true);
  try {
    // normalisasi bg hero: jika ada input eksternal → pakai itu
    const bg = contactExtBg?.trim()
      ? contactExtBg.trim()
      : contact.hero?.bgImage || null;

    const payload: ContactPageContent = {
      hero: {
        title: contact.hero?.title || "Hubungi Kami",
        subtitle: contact.hero?.subtitle || "",
        bgImage: bg || null,
        visible: contact.hero?.visible ?? true,
      },
      methods: {
        visible: contact.methods?.visible ?? true,
        items: (contact.methods?.items || []).map((it) => ({
          type: (it.type || "custom") as any,
          label: it.label || "",
          value: it.value || "",
          href: it.href || "",
          icon: it.icon || "",
        })),
      },
      hours: contact.hours
        ? {
            visible: contact.hours.visible ?? true,
            days: (contact.hours.days || []).map((d) => ({ label: d.label || "", value: d.value || "" })),
            note: contact.hours.note || "",
          }
        : { visible: false, days: [] },
      map: {
        visible: contact.map?.visible ?? true,
        embedUrl: contact.map?.embedUrl || "",
      },
      cta: {
        visible: contact.cta?.visible ?? true,
        title: contact.cta?.title || "Ingin Kerja Sama?",
        subtitle: contact.cta?.subtitle || "",
        buttonText: contact.cta?.buttonText || "Ajukan Kemitraan",
        href: contact.cta?.href || "/kemitraan",
      },
    };

    await upsertContent("contact", payload);
    alert("Pengaturan KONTAK tersimpan ✅");
  } catch (e: any) {
    alert(e?.message || String(e));
  } finally {
    setContactSaving(false);
  }
}

// ===== PARTNERS HANDLERS =====
function partnersAddLogo() {
  setPartners((cur) => ({ ...cur, logos: [...(cur.logos || []), { label: "", isActive: true }] }));
}
function partnersUpdateLogo(idx: number, key: keyof PartnerLogo, val: any) {
  setPartners((cur) => {
    const logos = [...(cur.logos || [])];
    logos[idx] = { ...logos[idx], [key]: val };
    return { ...cur, logos };
  });
}
function partnersRemoveLogo(idx: number) {
  setPartners((cur) => {
    const logos = [...(cur.logos || [])];
    logos.splice(idx, 1);
    return { ...cur, logos };
  });
}
function partnersMoveLogo(idx: number, dir: "up" | "down") {
  setPartners((cur) => {
    const logos = [...(cur.logos || [])];
    const to = dir === "up" ? idx - 1 : idx + 1;
    if (to < 0 || to >= logos.length) return cur;
    const [item] = logos.splice(idx, 1);
    logos.splice(to, 0, item);
    return { ...cur, logos };
  });
}

async function partnersUploadLogoFile(idx: number, f?: File | null) {
  if (!f) return;
  const url = await uploadPublicImage(f, "partners"); // simpan di folder "partners"
  partnersUpdateLogo(idx, "image", url);
}

async function partnersUploadDeckFile(f?: File | null) {
  if (!f) return;
  const url = await uploadPublicFile(f, "files"); // PDF deck
  setPartners((cur) => ({ ...cur, deckUrl: url }));
}

async function handleSavePartners() {
  setPartnersSaving(true);
  try {
    await upsertContent("partners", partners);
    alert("Pengaturan partnership tersimpan ✅");
  } catch (e: any) {
    console.error(e);
    alert(`Gagal menyimpan: ${e.message || e}`);
  } finally {
    setPartnersSaving(false);
  }
}

async function handleUploadQR(idx: number, f?: File | null) {
  if (!f) return;
  const url = await uploadPublicImage(f, "payments"); // bucket/folder "payments"
  updateEw(idx, "qrImage", url);
}

async function handleSavePayments() {
  setPaySaving(true);
  try {
    // tipis validasi: buang entri kosong
    const clean: PaymentsContent = {
      instructions: payments.instructions?.trim() || "",
      banks: payments.banks
        .filter(b => b.bank || b.accountNumber || b.accountName)
        .map(b => ({
          bank: b.bank.trim(),
          accountName: b.accountName.trim(),
          accountNumber: b.accountNumber.trim(),
          note: (b.note || "").trim(),
          isActive: !!b.isActive,
        })),
      ewallets: payments.ewallets
        .filter(e => e.provider || e.number || e.qrImage || e.accountName)
        .map(e => ({
          provider: e.provider.trim(),
          number: (e.number || "").trim(),
          accountName: (e.accountName || "").trim(),
          qrImage: e.qrImage || null,
          note: (e.note || "").trim(),
          isActive: !!e.isActive,
        })),
    };
    await upsertContent("payments", clean);
    alert("Pengaturan pembayaran tersimpan ✅");
  } catch (e: any) {
    console.error(e);
    alert(`Gagal menyimpan: ${e.message || e}`);
  } finally {
    setPaySaving(false);
  }
}

  /** RENDER BODY PER TAB */
  const body = (() => {
    switch (activeTab) {
      case "header":
        return (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-semibold">Header</h2>

            {headerLoading ? (
              <div className="text-gray-500">Memuat…</div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Judul Situs</label>
                  <input
                    type="text"
                    value={header.title ?? ""}
                    onChange={(e) => setHeader((h) => ({ ...h, title: e.target.value }))}
                    className="w-full rounded border px-3 py-2"
                    placeholder="Asa Bersama"
                  />
                  <p className="text-xs text-gray-500">Ditampilkan bila “Gunakan logo” tidak aktif.</p>
                </div>

                <div className="space-y-2">
  <label className="block text-sm font-medium">Logo (opsional)</label>

  {logoUrl ? (
    <div className="flex items-center gap-4">
      <img src={logoUrl} alt="Logo" className="h-10 w-auto rounded bg-white p-1 border" />
      <button
        onClick={() => { 
          setHeader((h) => ({ ...h, logo: null, useLogo: false }));
          setLogoExt("");
        }}
        className="px-3 py-2 rounded border"
      >
        Hapus logo
      </button>
    </div>
  ) : (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => handleUploadLogo(e.target.files?.[0] ?? null)}
    />
  )}

  {/* pemisah */}
  <div className="text-center text-gray-400 text-xs my-1">— atau —</div>

  {/* URL eksternal */}
  <div className="grid gap-2">
    <input
      type="url"
      inputMode="url"
      className="w-full rounded border px-3 py-2"
      placeholder="https://domain-kamu.com/logo.png"
      value={logoExt}
      onChange={(e) => setLogoExt(e.target.value)}
    />
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          const val = logoExt.trim();
          if (!val) return;
          setHeader((h) => ({ ...h, logo: val, useLogo: true }));
        }}
        className="px-3 py-2 rounded border"
      >
        Gunakan URL
      </button>

      {logoExt && /^https?:\/\//i.test(logoExt) && (
        <span className="text-xs text-green-600">URL valid</span>
      )}
      {logoExt && !/^https?:\/\//i.test(logoExt) && (
        <span className="text-xs text-amber-600">Sertakan http(s):// di awal</span>
      )}
    </div>
    <p className="text-xs text-gray-500">
      Kamu juga bisa menempelkan URL dari CDN/hosting kamu (PNG/SVG/JPG). Tidak disalin ke bucket.
    </p>
  </div>

  <div className="flex items-center gap-2">
    <input
      id="useLogo"
      type="checkbox"
      checked={!!header.useLogo}
      onChange={(e) => setHeader((h) => ({ ...h, useLogo: e.target.checked }))}
    />
    <label htmlFor="useLogo">Gunakan logo sebagai brand</label>
  </div>
</div>


                <div className="pt-2">
                  <button
                    onClick={handleSaveHeader}
                    disabled={headerSaving}
                    className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
                  >
                    {headerSaving ? "Menyimpan…" : "Simpan"}
                  </button>
                </div>

                <div className="pt-4">
                  <h3 className="font-medium mb-2">Preview kecil</h3>
                  <div className="flex items-center gap-3 border rounded px-3 py-2 w-fit bg-white">
                    {header.useLogo && logoUrl ? (
                      <img src={logoUrl} className="h-8 w-auto" alt="Logo preview" />
                    ) : (
                      <span className="text-xl font-semibold">{header.title || "Asa Bersama"}</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "hero":
        return (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-semibold">Hero</h2>

            {heroLoading ? (
              <div className="text-gray-500">Memuat…</div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Headline</label>
                  <input
                    type="text"
                    className="w-full rounded border px-3 py-2"
                    value={hero.headline ?? ""}
                    onChange={(e) => setHero((v) => ({ ...v, headline: e.target.value }))}
                    placeholder="Kebaikan Anda, Kekuatan Mereka."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Subheadline</label>
                  <textarea
                    className="w-full rounded border px-3 py-2 min-h-[110px]"
                    value={hero.subheadline ?? ""}
                    onChange={(e) => setHero((v) => ({ ...v, subheadline: e.target.value }))}
                    placeholder="Kalimat pendukung singkat…"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">CTA Text</label>
                    <input
                      type="text"
                      className="w-full rounded border px-3 py-2"
                      value={hero.ctaText ?? ""}
                      onChange={(e) => setHero((v) => ({ ...v, ctaText: e.target.value }))}
                      placeholder="Bantu Mereka Sekarang"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">CTA Link</label>
                    <input
                      type="text"
                      className="w-full rounded border px-3 py-2"
                      value={hero.ctaHref ?? ""}
                      onChange={(e) => setHero((v) => ({ ...v, ctaHref: e.target.value }))}
                      placeholder="#campaigns atau /kemitraan"
                    />
                    <p className="text-xs text-gray-500">
                      Bisa anchor (mis. <code>#campaigns</code>) atau path (mis. <code>/kemitraan</code>)
                    </p>
                  </div>
                </div>

                {/* Background hero: upload atau URL eksternal */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Background Hero (opsional)</label>

                  {hero.bgImage && (
                    <div className="flex items-center gap-4 mb-2">
                      <img
                        src={ensurePublicUrl(hero.bgImage) ?? ""}
                        alt="Preview background"
                        className="h-20 w-auto rounded border bg-white object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setHero((v) => ({ ...v, bgImage: null }));
                          setExtUrl("");
                        }}
                        className="px-3 py-2 rounded border"
                      >
                        Hapus background
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const url = await uploadPublicImage(f, "hero");
                        setHero((v) => ({ ...v, bgImage: url }));
                        setExtUrl("");
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Rekomendasi ukuran: <b>1920×900px</b> (min 1600×800px), rasio ~<b>21:10</b>. Gambar
                      akan di-<i>cover</i> & diposisikan <i>center</i>.
                    </p>
                  </div>

                  <div className="text-center text-gray-400 text-xs my-2">— atau —</div>

                  <div className="grid gap-2">
                    <input
                      type="url"
                      inputMode="url"
                      placeholder="https://domain-kamu.com/path/hero.jpg"
                      className="w-full rounded border px-3 py-2"
                      value={extUrl}
                      onChange={(e) => setExtUrl(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const val = extUrl.trim();
                          if (!val) return;
                          setHero((v) => ({ ...v, bgImage: val }));
                        }}
                        className="px-3 py-2 rounded border"
                      >
                        Gunakan URL
                      </button>
                      {extUrl && /^https?:\/\//i.test(extUrl) && (
                        <span className="text-xs text-green-600">URL valid</span>
                      )}
                      {extUrl && !/^https?:\/\//i.test(extUrl) && (
                        <span className="text-xs text-amber-600">Sertakan http(s):// di awal</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveHero}
                    disabled={heroSaving}
                    className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
                  >
                    {heroSaving ? "Menyimpan…" : "Simpan"}
                  </button>
                </div>
              </>
            )}
          </div>
        );

      case "impact":
        return (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-semibold">Impact Stats</h2>

            {impactLoading ? (
              <div className="text-gray-500">Memuat…</div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Dana Terkumpul (rupiah)</label>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="w-full rounded border px-3 py-2"
                    value={impact.fundRaised}
                    onChange={(e) =>
                      setImpact((v) => ({ ...v, fundRaised: Number(e.target.value) || 0 }))
                    }
                    placeholder="Contoh: 1200000000"
                  />
                  <p className="text-xs text-gray-500">Masukkan angka utuh (tanpa titik/koma).</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Donatur Baik Hati</label>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className="w-full rounded border px-3 py-2"
                      value={impact.donors}
                      onChange={(e) =>
                        setImpact((v) => ({ ...v, donors: Number(e.target.value) || 0 }))
                      }
                      placeholder="8500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Penerima Manfaat</label>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className="w-full rounded border px-3 py-2"
                      value={impact.beneficiaries}
                      onChange={(e) =>
                        setImpact((v) => ({ ...v, beneficiaries: Number(e.target.value) || 0 }))
                      }
                      placeholder="350"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveImpact}
                    disabled={impactSaving}
                    className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
                  >
                    {impactSaving ? "Menyimpan…" : "Simpan"}
                  </button>
                </div>
              </>
            )}
          </div>
        );
      
      case "payments":
  return (
    <div className="max-w-3xl space-y-8">
      <h2 className="text-xl font-semibold">Pembayaran</h2>

      {payLoading ? (
        <div className="text-gray-500">Memuat…</div>
      ) : (
        <>
          {/* Instruksi umum */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Instruksi / Catatan Umum</label>
            <textarea
              className="w-full rounded border px-3 py-2 min-h-[100px]"
              placeholder="Contoh: Setelah transfer, mohon unggah bukti di halaman konfirmasi."
              value={payments.instructions ?? ""}
              onChange={(e) => setPayments(v => ({ ...v, instructions: e.target.value }))}
            />
          </div>

          {/* BANK ACCOUNTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Rekening Bank</h3>
              <button
                type="button"
                onClick={addBank}
                className="px-3 py-2 rounded border"
              >
                + Tambah Rekening
              </button>
            </div>

            {payments.banks.length === 0 && (
              <div className="text-sm text-gray-500">Belum ada rekening bank.</div>
            )}

            <div className="space-y-4">
              {payments.banks.map((b, i) => (
                <div key={i} className="rounded-lg border p-3 grid md:grid-cols-2 gap-3 bg-white">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Bank</label>
                    <input
                      className="w-full rounded border px-3 py-2"
                      placeholder="BCA / Mandiri / BNI / BRI"
                      value={b.bank}
                      onChange={(e) => updateBank(i, "bank", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Nama Pemilik</label>
                    <input
                      className="w-full rounded border px-3 py-2"
                      placeholder="Nama pemilik rekening"
                      value={b.accountName}
                      onChange={(e) => updateBank(i, "accountName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Nomor Rekening</label>
                    <input
                      className="w-full rounded border px-3 py-2"
                      placeholder="1234567890"
                      value={b.accountNumber}
                      onChange={(e) => updateBank(i, "accountNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Catatan (opsional)</label>
                    <input
                      className="w-full rounded border px-3 py-2"
                      placeholder="Cabang, kode unik, dsb."
                      value={b.note || ""}
                      onChange={(e) => updateBank(i, "note", e.target.value)}
                    />
                  </div>

                  <div className="col-span-full flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!b.isActive}
                        onChange={(e) => updateBank(i, "isActive", e.target.checked)}
                      />
                      Tampilkan
                    </label>
                    <button
                      type="button"
                      onClick={() => removeBank(i)}
                      className="px-3 py-2 rounded border text-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* E-WALLETS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">E-Wallet</h3>
              <button
                type="button"
                onClick={addEw}
                className="px-3 py-2 rounded border"
              >
                + Tambah E-Wallet
              </button>
            </div>

            {payments.ewallets.length === 0 && (
              <div className="text-sm text-gray-500">Belum ada e-wallet.</div>
            )}

            <div className="space-y-4">
              {payments.ewallets.map((e, i) => (
                <div key={i} className="rounded-lg border p-3 grid md:grid-cols-2 gap-3 bg-white">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Provider</label>
                    <input
                      className="w-full rounded border px-3 py-2"
                      placeholder="OVO / Dana / GoPay / ShopeePay"
                      value={e.provider}
                      onChange={(ev) => updateEw(i, "provider", ev.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Nama Akun</label>
                    <input
                      className="w-full rounded border px-3 py-2"
                      placeholder="Nama di akun e-wallet"
                      value={e.accountName || ""}
                      onChange={(ev) => updateEw(i, "accountName", ev.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Nomor (opsional)</label>
                    <input
                      className="w-full rounded border px-3 py-2"
                      placeholder="08xxxxxxxxxx"
                      value={e.number || ""}
                      onChange={(ev) => updateEw(i, "number", ev.target.value)}
                    />
                  </div>

                  {/* QR Image: bisa URL langsung + upload */}
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">URL QR (opsional)</label>
                    <input
                      type="url"
                      inputMode="url"
                      className="w-full rounded border px-3 py-2"
                      placeholder="https://…"
                      value={e.qrImage || ""}
                      onChange={(ev) => updateEw(i, "qrImage", ev.target.value)}
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(ev) => handleUploadQR(i, ev.target.files?.[0] ?? null)}
                      />
                      {e.qrImage ? (
                        <img
                          src={ensurePublicUrl(e.qrImage) ?? ""}
                          alt="QR"
                          className="h-10 w-10 rounded border object-cover"
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Catatan (opsional)</label>
                    <input
                      className="w-full rounded border px-3 py-2"
                      placeholder="Catatan pembayaran, kode unik, dsb."
                      value={e.note || ""}
                      onChange={(ev) => updateEw(i, "note", ev.target.value)}
                    />
                  </div>

                  <div className="col-span-full flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!e.isActive}
                        onChange={(ev) => updateEw(i, "isActive", ev.target.checked)}
                      />
                      Tampilkan
                    </label>
                    <button
                      type="button"
                      onClick={() => removeEw(i)}
                      className="px-3 py-2 rounded border text-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSavePayments}
              disabled={paySaving}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
            >
              {paySaving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </>
      )}
    </div>
  );

      case "partnership":
  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-semibold">Partnership (Homepage Teaser)</h2>

      {partnersLoading ? (
        <div className="text-gray-500">Memuat…</div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <input
              id="partners_enabled"
              type="checkbox"
              checked={!!partners.enabled}
              onChange={(e) => setPartners((v) => ({ ...v, enabled: e.target.checked }))}
            />
            <label htmlFor="partners_enabled">Tampilkan section ini di homepage</label>
          </div>

          {/* Deck (PDF) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Deck (PDF)</label>
            <div className="grid md:grid-cols-[1fr,auto] gap-3">
              <input
                type="url"
                inputMode="url"
                className="w-full rounded border px-3 py-2"
                placeholder="https://domain.com/Deck-Kemitraan.pdf"
                value={partners.deckUrl || ""}
                onChange={(e) => setPartners((v) => ({ ...v, deckUrl: e.target.value }))}
              />
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <span className="px-3 py-2 rounded border">Upload PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => partnersUploadDeckFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">Isi URL langsung atau upload file PDF.</p>
          </div>

          {/* Logos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Logo Mitra</h3>
              <button type="button" onClick={partnersAddLogo} className="px-3 py-2 rounded border">
                + Tambah Logo
              </button>
            </div>

            {(!partners.logos || partners.logos.length === 0) && (
              <div className="text-sm text-gray-500">Belum ada logo.</div>
            )}

            <div className="space-y-4">
              {(partners.logos || []).map((l, i) => (
                <div key={i} className="rounded-lg border p-3 bg-white grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Nama/Label</label>
                    <input
                      className="w-full rounded border px-3 py-2"
                      placeholder="Nama mitra"
                      value={l.label}
                      onChange={(e) => partnersUpdateLogo(i, "label", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">URL Gambar (opsional)</label>
                    <input
                      type="url"
                      inputMode="url"
                      className="w-full rounded border px-3 py-2"
                      placeholder="https://… (PNG/SVG)"
                      value={l.image || ""}
                      onChange={(e) => partnersUpdateLogo(i, "image", e.target.value)}
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => partnersUploadLogoFile(i, e.target.files?.[0] ?? null)}
                      />
                    </div>
                  </div>

                  <div className="col-span-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={l.isActive !== false}
                          onChange={(e) => partnersUpdateLogo(i, "isActive", e.target.checked)}
                        />
                        Tampilkan
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => partnersMoveLogo(i, "up")}
                        className="px-3 py-2 rounded border"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => partnersMoveLogo(i, "down")}
                        className="px-3 py-2 rounded border"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => partnersRemoveLogo(i)}
                        className="px-3 py-2 rounded border text-red-600"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSavePartners}
              disabled={partnersSaving}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
            >
              {partnersSaving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </>
      )}
    </div>
  );

    case "contact":
  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-xl font-semibold">Kontak</h2>

      {contactLoading ? (
        <div className="text-gray-500">Memuat…</div>
      ) : (
        <>
          {/* HERO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Hero</h3>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!contact.hero?.visible}
                  onChange={(e) =>
                    setContact((cur) => ({ ...cur, hero: { ...cur.hero, visible: e.target.checked } }))
                  }
                />
                Tampilkan
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Judul</label>
              <input
                className="w-full rounded border px-3 py-2"
                value={contact.hero?.title || ""}
                onChange={(e) => setContact((cur) => ({ ...cur, hero: { ...cur.hero, title: e.target.value } }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subjudul</label>
              <textarea
                className="w-full rounded border px-3 py-2 min-h-[80px]"
                value={contact.hero?.subtitle || ""}
                onChange={(e) => setContact((cur) => ({ ...cur, hero: { ...cur.hero, subtitle: e.target.value } }))}
              />
            </div>

            {/* BG: upload / URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Background Hero</label>
              {contact.hero?.bgImage ? (
                <div className="flex items-center gap-3">
                  <img
                    src={ensurePublicUrl(contact.hero.bgImage) ?? ""}
                    className="h-16 w-auto rounded border bg-white object-cover"
                    alt="bg hero"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 rounded border"
                    onClick={() => { setContact((cur) => ({ ...cur, hero: { ...cur.hero, bgImage: null } })); setContactExtBg(""); }}
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadContactHero(e.target.files?.[0] ?? null)}
                />
              )}

              <div className="text-center text-gray-400 text-xs">— atau —</div>
              <input
                type="url"
                inputMode="url"
                className="w-full rounded border px-3 py-2"
                placeholder="https://domain-kamu.com/hero-kontak.jpg"
                value={contactExtBg}
                onChange={(e) => setContactExtBg(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Rekomendasi: 1600×600–900px, cover, center.
              </p>
            </div>
          </div>

          {/* METHODS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Metode Kontak</h3>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!contact.methods?.visible}
                    onChange={(e) =>
                      setContact((cur) => ({ ...cur, methods: { ...cur.methods, visible: e.target.checked } }))
                    }
                  />
                  Tampilkan
                </label>
                <button type="button" className="px-3 py-2 rounded border" onClick={addMethod}>
                  + Tambah Metode
                </button>
              </div>
            </div>

            {(contact.methods?.items || []).length === 0 && (
              <div className="text-sm text-gray-500">Belum ada metode kontak.</div>
            )}

            <div className="space-y-4">
              {(contact.methods?.items || []).map((m, i) => (
                <div key={i} className="rounded-lg border p-3 grid md:grid-cols-2 gap-3 bg-white">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Tipe</label>
                    <select
                      className="w-full rounded border px-3 py-2"
                      value={m.type}
                      onChange={(e) => updateMethod(i, "type", e.target.value)}
                    >
                      <option value="whatsapp">whatsapp</option>
                      <option value="email">email</option>
                      <option value="phone">phone</option>
                      <option value="address">address</option>
                      <option value="custom">custom</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Label</label>
                    <input
                      className="w-full rounded border px-3 py-2"
                      value={m.label}
                      onChange={(e) => updateMethod(i, "label", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Value (yang ditampilkan)</label>
                    <input
                      className="w-full rounded border px-3 py-2"
                      value={m.value}
                      onChange={(e) => updateMethod(i, "value", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Href (opsional)</label>
                    <input
                      className="w-full rounded border px-3 py-2"
                      placeholder="tel:+62..., mailto:..., https://wa.me/..."
                      value={m.href || ""}
                      onChange={(e) => updateMethod(i, "href", e.target.value)}
                    />
                  </div>

                  <div className="col-span-full flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Icon (opsional): simpan nama ikon, mis. <code>FiPhone</code>
                    </div>
                    <button type="button" className="px-3 py-2 rounded border text-red-600" onClick={() => removeMethod(i)}>
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HOURS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Jam Operasional</h3>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!contact.hours?.visible}
                  onChange={(e) => setContact((cur) => ({ ...cur, hours: { ...(cur.hours || { days: [] }), visible: e.target.checked } }))}
                />
                Tampilkan
              </label>
            </div>

            <div className="space-y-2">
              {(contact.hours?.days || []).map((d, i) => (
                <div key={i} className="grid md:grid-cols-[1fr,2fr,auto] gap-2">
                  <input
                    className="rounded border px-3 py-2"
                    placeholder="Sen–Jum"
                    value={d.label}
                    onChange={(e) => updateHourDay(i, "label", e.target.value)}
                  />
                  <input
                    className="rounded border px-3 py-2"
                    placeholder="09.00–17.00"
                    value={d.value}
                    onChange={(e) => updateHourDay(i, "value", e.target.value)}
                  />
                  <button type="button" className="px-3 py-2 rounded border text-red-600" onClick={() => removeHourDay(i)}>
                    Hapus
                  </button>
                </div>
              ))}

              <button type="button" className="px-3 py-2 rounded border" onClick={addHourDay}>
                + Tambah Baris
              </button>

              <div className="space-y-1">
                <label className="text-xs text-gray-600">Catatan (opsional)</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={contact.hours?.note || ""}
                  onChange={(e) => setContact((cur) => ({ ...cur, hours: { ...(cur.hours || { days: [] }), note: e.target.value } }))}
                />
              </div>
            </div>
          </div>

          {/* MAP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Peta (Google Maps embed)</h3>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!contact.map?.visible}
                  onChange={(e) => setContact((cur) => ({ ...cur, map: { ...(cur.map || {}), visible: e.target.checked } }))}
                />
                Tampilkan
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Embed URL (nilai <code>src</code> saja)</label>
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="https://www.google.com/maps/embed?pb=..."
                value={contact.map?.embedUrl || ""}
                onChange={(e) => setContact((cur) => ({ ...cur, map: { ...(cur.map || {}), embedUrl: e.target.value } }))}
              />
              {contact.map?.embedUrl ? (
                <div className="rounded border overflow-hidden">
                  <iframe
                    title="map-preview"
                    src={contact.map.embedUrl}
                    className="w-full h-[220px] md:h-[280px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">CTA Bawah</h3>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!contact.cta?.visible}
                    onChange={(e) =>
    setContact((cur) => ({
      ...cur,
      cta: { ...withCta(cur.cta), visible: e.target.checked },
    }))
  }
/>
                Tampilkan
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-gray-600">Judul</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={contact.cta?.title || ""}
                  onChange={(e) =>
  setContact((cur) => ({
    ...cur,
    cta: { ...withCta(cur.cta), title: e.target.value },
  }))
}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-600">Teks Tombol</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={contact.cta?.buttonText || ""}
                  onChange={(e) =>
  setContact((cur) => ({
    ...cur,
    cta: { ...withCta(cur.cta), buttonText: e.target.value },
  }))
}
                />
              </label>
              <label className="md:col-span-2 space-y-1">
                <span className="text-xs text-gray-600">Subjudul (opsional)</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={contact.cta?.subtitle || ""}
                  onChange={(e) =>
  setContact((cur) => ({
    ...cur,
    cta: { ...withCta(cur.cta), subtitle: e.target.value },
  }))
}
                />
              </label>
              <label className="md:col-span-2 space-y-1">
                <span className="text-xs text-gray-600">Link</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  placeholder="#campaigns /kemitraan dsb."
                  value={contact.cta?.href || ""}
                  onChange={(e) =>
  setContact((cur) => ({
    ...cur,
    cta: { ...withCta(cur.cta), href: e.target.value },
  }))
}
                />
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveContact}
              disabled={contactSaving}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
            >
              {contactSaving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </>
      )}
    </div>
  );

      case "seo":
  return (
    <div className="max-w-5xl space-y-8">
      <h2 className="text-xl font-semibold">SEO</h2>

      {/* GLOBAL SEO */}
      <section className="bg-white rounded-2xl border p-4 space-y-3">
        <h3 className="text-lg font-semibold">Global</h3>

        {seoLoading ? (
          <div className="text-gray-500">Memuat…</div>
        ) : (
          <>
            <label className="block">
              <span className="text-sm">Site Title</span>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={seoSettings.siteTitle || ""}
                onChange={(e) => setSeoSettings({ ...seoSettings, siteTitle: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="text-sm">Site Description</span>
              <textarea
                className="mt-1 w-full rounded border px-3 py-2 min-h-[90px]"
                value={seoSettings.siteDescription || ""}
                onChange={(e) => setSeoSettings({ ...seoSettings, siteDescription: e.target.value })}
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm">Canonical Domain (siteUrl)</span>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={seoSettings.siteUrl || ""}
                  onChange={(e) => setSeoSettings({ ...seoSettings, siteUrl: e.target.value })}
                  placeholder="https://www.grahakita.id"
                />
              </label>
              <label className="block">
                <span className="text-sm">Locale</span>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={seoSettings.locale || ""}
                  onChange={(e) => setSeoSettings({ ...seoSettings, locale: e.target.value })}
                  placeholder="id_ID"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm">Theme Color</span>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={seoSettings.themeColor || ""}
                  onChange={(e) => setSeoSettings({ ...seoSettings, themeColor: e.target.value })}
                  placeholder="#0ea5e9"
                />
              </label>

              <div className="block">
                <span className="text-sm">Default OG Image</span>
                <div className="flex gap-2 items-center mt-1">
                  <input
                    className="flex-1 w-full rounded border px-3 py-2"
                    value={seoSettings.defaultOgImage || ""}
                    onChange={(e) =>
                      setSeoSettings({ ...seoSettings, defaultOgImage: e.target.value })
                    }
                    placeholder="https://…/og.jpg"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadSeoOg(e.target.files?.[0] ?? null)}
                  />
                </div>
                {seoSettings.defaultOgImage ? (
                  <div className="mt-2">
                    <img
                      src={ensurePublicUrl(seoSettings.defaultOgImage) ?? ""}
                      alt="OG preview"
                      className="h-24 rounded border object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-sm">Twitter</span>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={seoSettings.social?.twitter || ""}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      social: { ...seoSettings.social, twitter: e.target.value },
                    })
                  }
                  placeholder="@username"
                />
              </label>
              <label className="block">
                <span className="text-sm">Facebook</span>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={seoSettings.social?.facebook || ""}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      social: { ...seoSettings.social, facebook: e.target.value },
                    })
                  }
                  placeholder="page"
                />
              </label>
              <label className="block">
                <span className="text-sm">Instagram</span>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={seoSettings.social?.instagram || ""}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      social: { ...seoSettings.social, instagram: e.target.value },
                    })
                  }
                  placeholder="@username"
                />
              </label>
            </div>
          </>
        )}
      </section>

      {/* PER-PAGE OVERRIDES */}
      <section className="bg-white rounded-2xl border p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Per-Page Overrides</h3>
          <button type="button" onClick={addSeoPage} className="px-3 py-2 rounded border">
            + Tambah
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-3">
          Contoh path: <code>/</code>, <code>/tentang-kami</code>, <code>/kontak</code>, <code>/p/artikel-slug</code>, <code>/campaign/slug</code>
        </p>

        <div className="space-y-3">
          {seoPages.map((p, i) => (
            <div key={i} className="border rounded p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-sm">Path</span>
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={p.path}
                    onChange={(e) => updateSeoPage(i, { path: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm">Title</span>
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={p.title || ""}
                    onChange={(e) => updateSeoPage(i, { title: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm">Image URL</span>
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={p.image || ""}
                    onChange={(e) => updateSeoPage(i, { image: e.target.value })}
                    placeholder="https://…/og.jpg"
                  />
                </label>
              </div>

              <label className="block mt-2">
                <span className="text-sm">Description</span>
                <textarea
                  className="mt-1 w-full rounded border px-3 py-2 min-h-[70px]"
                  value={p.description || ""}
                  onChange={(e) => updateSeoPage(i, { description: e.target.value })}
                ></textarea>
              </label>

              <label className="inline-flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={!!p.noindex}
                  onChange={(e) => updateSeoPage(i, { noindex: e.target.checked })}
                />
                <span className="text-sm">Noindex (sembunyikan dari mesin pencari)</span>
              </label>

              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => removeSeoPage(i)}
                  className="px-3 py-2 rounded border text-rose-600"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSaveSEO}
          disabled={seoSaving}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
        >
          {seoSaving ? "Menyimpan…" : "Simpan"}
        </button>

        <button
          type="button"
          onClick={triggerNetlifyBuildSEO}
          className="px-4 py-2 rounded border"
        >
          {seoBuildState === "posting" ? "Triggering…" : "Publish SEO (Rebuild)"}
        </button>
      </div>
    </div>
  );
    
      case "footer":
        return (
          <div className="max-w-3xl space-y-8">
            <h2 className="text-xl font-semibold">Footer</h2>

            {footerLoading ? (
              <div className="text-gray-500">Memuat…</div>
            ) : (
              <>
                {/* Identitas */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Nama Situs</label>
                    <input
                      type="text"
                      className="w-full rounded border px-3 py-2"
                      value={footer.siteName}
                      onChange={(e) => setFooter({ ...footer, siteName: e.target.value })}
                      placeholder="Asa Bersama"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">No. SK Kemenkumham</label>
                    <input
                      type="text"
                      className="w-full rounded border px-3 py-2"
                      value={footer.skNumber}
                      onChange={(e) => setFooter({ ...footer, skNumber: e.target.value })}
                      placeholder="AHU-12345.AH.01.04.Tahun 2024"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Deskripsi Singkat</label>
                  <textarea
                    className="w-full rounded border px-3 py-2 min-h-[100px]"
                    value={footer.description}
                    onChange={(e) => setFooter({ ...footer, description: e.target.value })}
                    placeholder="Yayasan non-profit yang berdedikasi..."
                  />
                </div>

                {/* Tautan cepat */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Tautan Cepat</h3>
                    <button
                      type="button"
                      onClick={handleFooterAddLink}
                      className="px-3 py-1.5 rounded border text-sm"
                    >
                      + Tambah tautan
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(footer.links || []).map((lnk, idx) => (
                      <div key={idx} className="grid md:grid-cols-[1fr,1fr,auto] gap-2">
                        <input
                          type="text"
                          className="rounded border px-3 py-2"
                          placeholder="Label (mis. FAQ)"
                          value={lnk.label}
                          onChange={(e) => handleFooterLinkChange(idx, "label", e.target.value)}
                        />
                        <input
                          type="text"
                          className="rounded border px-3 py-2"
                          placeholder="URL (mis. /#faq)"
                          value={lnk.href}
                          onChange={(e) => handleFooterLinkChange(idx, "href", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleFooterRemoveLink(idx)}
                          className="px-3 py-2 rounded border text-sm"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kontak */}
                <div className="space-y-2">
                  <h3 className="font-medium">Kontak</h3>
                  <textarea
                    className="w-full rounded border px-3 py-2"
                    placeholder="Alamat lengkap…"
                    value={footer.contact.address}
                    onChange={(e) =>
                      setFooter({ ...footer, contact: { ...footer.contact, address: e.target.value } })
                    }
                  />
                  <div className="grid md:grid-cols-3 gap-3">
                    <input
                      type="email"
                      className="rounded border px-3 py-2"
                      placeholder="Email"
                      value={footer.contact.email || ""}
                      onChange={(e) =>
                        setFooter({ ...footer, contact: { ...footer.contact, email: e.target.value } })
                      }
                    />
                    <input
                      type="text"
                      className="rounded border px-3 py-2"
                      placeholder="Telepon kantor"
                      value={footer.contact.phone || ""}
                      onChange={(e) =>
                        setFooter({ ...footer, contact: { ...footer.contact, phone: e.target.value } })
                      }
                    />
                    <input
                      type="text"
                      className="rounded border px-3 py-2"
                      placeholder="WhatsApp (62xxxxxxxxxx)"
                      value={footer.contact.whatsapp || ""}
                      onChange={(e) =>
                        setFooter({ ...footer, contact: { ...footer.contact, whatsapp: e.target.value } })
                      }
                    />
                  </div>
                </div>

                {/* Maps */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Google Maps (Embed URL)</label>
                  <input
                    type="text"
                    className="w-full rounded border px-3 py-2"
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    value={footer.mapEmbedUrl || ""}
                    onChange={(e) => setFooter({ ...footer, mapEmbedUrl: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Gunakan URL <i>Embed</i> dari Google Maps (Share → Embed a map → Copy HTML, ambil bagian
                    <code> src </code>).
                  </p>
                </div>

                {/* Sosial */}
                <div className="space-y-2">
                  <h3 className="font-medium">Sosial Media (opsional)</h3>
                  <div className="grid md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      className="rounded border px-3 py-2"
                      placeholder="Instagram URL"
                      value={footer.social?.instagram || ""}
                      onChange={(e) =>
                        setFooter({ ...footer, social: { ...footer.social, instagram: e.target.value } })
                      }
                    />
                    <input
                      type="text"
                      className="rounded border px-3 py-2"
                      placeholder="Facebook URL"
                      value={footer.social?.facebook || ""}
                      onChange={(e) =>
                        setFooter({ ...footer, social: { ...footer.social, facebook: e.target.value } })
                      }
                    />
                    <input
                      type="text"
                      className="rounded border px-3 py-2"
                      placeholder="YouTube URL"
                      value={footer.social?.youtube || ""}
                      onChange={(e) =>
                        setFooter({ ...footer, social: { ...footer.social, youtube: e.target.value } })
                      }
                    />
                    <input
                      type="text"
                      className="rounded border px-3 py-2"
                      placeholder="TikTok URL"
                      value={footer.social?.tiktok || ""}
                      onChange={(e) =>
                        setFooter({ ...footer, social: { ...footer.social, tiktok: e.target.value } })
                      }
                    />
                  </div>
                </div>

                {/* Simpan */}
                <div className="pt-2">
                  <button
                    onClick={handleSaveFooter}
                    disabled={footerSaving}
                    className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
                  >
                    {footerSaving ? "Menyimpan…" : "Simpan"}
                  </button>
                </div>
              </>
            )}
          </div>
        );
    }
  })();

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Pengaturan Situs</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["header","hero","impact","footer","payments","partnership","contact","seo"] as const).map((t) => (
  <button
    key={t}
    onClick={() => setActiveTab(t)}
    className={`px-3 py-2 rounded border ${
      activeTab === t ? "bg-black text-white" : "bg-white"
    }`}
  >
    {t.toUpperCase()}
  </button>
))}

      </div>

      {body}
    </div>
  );
}
