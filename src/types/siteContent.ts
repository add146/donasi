// src/types/siteContent.ts

// ======================== HEADER / HERO / IMPACT ========================
export type HeaderContent = {
  title?: string | null;
  logo?: string | null;    // path di storage atau URL publik
  useLogo?: boolean;
};

export type HeroContent = {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaHref?: string;
  bgImage?: string | null;
};

export type ImpactContent = {
  fundRaised: number;
  donors?: number;
  beneficiaries?: number;
};

// ======================== PAYMENTS ========================
export type BankAccount = {
  bank: string;            // nama bank, mis. "BCA", "Mandiri"
  accountName: string;     // nama pemilik
  accountNumber: string;   // nomor rekening
  note?: string;           // catatan opsional
  isActive?: boolean;      // tampilkan / sembunyikan
};

export type EWallet = {
  provider: string;        // mis. "OVO", "Dana", "GoPay", "ShopeePay"
  number?: string;         // nomor e-wallet (opsional jika pakai QR)
  accountName?: string;    // nama di akun e-wallet
  qrImage?: string | null; // URL gambar QR (supabase/public atau eksternal)
  note?: string;           // catatan opsional
  isActive?: boolean;
};

export type PaymentsContent = {
  instructions?: string;   // pesan/instruksi umum pembayaran
  banks: BankAccount[];
  ewallets: EWallet[];
};

// ======================== FOOTER ========================
export type FooterLink = { label: string; href: string };

export type FooterContent = {
  siteName: string;            // "Asa Bersama"
  description: string;         // deskripsi singkat yayasan
  skNumber: string;            // "AHU-12345.AH.01.04.Tahun 2024"
  links: FooterLink[];         // Tautan cepat (FAQ, Transparansi, dst)
  contact: {
    address: string;           // Alamat lengkap
    email?: string;
    phone?: string;            // nomor telp kantor (opsional)
    whatsapp?: string;         // untuk ikon WA (opsional)
  };
  mapEmbedUrl?: string;        // URL embed Google Maps (opsional)
  social?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    whatsapp?: string;         // untuk klik chat
  };
};

// ======================== PARTNERS (Homepage teaser) ========================
export type PartnerLogo = {
  label: string;             // nama/logo text (fallback)
  image?: string | null;     // URL gambar (opsional)
  isActive?: boolean;        // toggle tampil
};

export type PartnersContent = {
  enabled: boolean;          // tampilkan section di homepage
  deckUrl?: string | null;   // URL ke PDF deck
  logos: PartnerLogo[];      // daftar logo
};

export const DEFAULT_PARTNERS: PartnersContent = {
  enabled: true,
  deckUrl: null,
  logos: [
    { label: "BNI", isActive: true },
    { label: "BNI Syariah", isActive: true },
    { label: "BUMN Peduli", isActive: true },
    { label: "Yayasan Kita", isActive: true },
  ],
};

// ======================== LAIN-LAIN (home widgets) ========================
export type HowItWorksContent = {
  visible?: boolean; // default true
};

export type AppPromoContent = {
  visible?: boolean;          // toggle tampil/sembunyi
  image?: string | null;      // Supabase public URL atau URL eksternal
  playUrl?: string;           // link Google Play
  appUrl?: string;            // link App Store (opsional)
};

// ======================== CONTACT PAGE ========================
export type ContactMethodItem = {
  type: "whatsapp" | "email" | "phone" | "address" | "custom";
  label: string;         // "WhatsApp", "Email", "Kantor", dst.
  value: string;         // teks yang ditampilkan (no. telp, alamat, dsb.)
  href?: string;         // tel: / mailto: / https://wa.me/... / url lain
  icon?: string;         // opsional: nama ikon (mis. "FiPhone")
};

export type ContactPageContent = {
  hero: {
    title: string;
    subtitle?: string;
    bgImage?: string | null;   // supabase public URL atau eksternal
    visible?: boolean;
  };
  methods: {
    visible?: boolean;
    items: ContactMethodItem[];
  };
  hours?: {
    visible?: boolean;
    days: Array<{ label: string; value: string }>;
    note?: string;
  };
  map?: {
    visible?: boolean;
    embedUrl?: string;         // hanya nilai src dari Google Maps embed
  };
  cta?: {
    visible?: boolean;
    title: string;
    subtitle?: string;
    buttonText: string;
    href: string;              // anchor atau path (mis. /kemitraan)
  };
};

// ======================== ABOUT PAGE TYPES ========================
export type AboutStatsItem = {
  label: string;
  value: string;
  icon?: string;      // simpan nama ikon (mis. "FiUsers"), opsional
  visible?: boolean;
};

export type AboutInfoCard = {
  badge: string;      // "Visi" / "Misi"
  title: string;
  desc: string;
  icon?: string;      // nama ikon opsional
  visible?: boolean;
};

export type AboutValueItem = {
  title: string;      // "Integritas" dsb.
  desc: string;       // deskripsi singkat
  icon?: string;      // nama ikon opsional
  visible?: boolean;
};

export type AboutTimelineItem = {
  year: string;       // "2021"
  title: string;      // "Mulai dari komunitas"
  desc: string;       // deskripsi
};

// Media kanan untuk Timeline (opsional, PPT)
export type AboutTimelineMedia = {
  pptUrl?: string;
  caption?: string;
};

export type AboutTeamItem = {
  name: string;
  role: string;
  img?: string | null; // URL publik
  visible?: boolean;
};

export type AboutCTA = {
  visible?: boolean;
  title: string;
  subtitle?: string;
  primaryText: string;
  primaryHref: string;
  secondaryText?: string;
  secondaryHref?: string;
  image?: string | null;
};

export type AboutHero = {
  visible?: boolean;
  badge?: string;      // teks kecil di atas judul
  title: string;
  subtitle?: string;
  bgImage?: string | null; // URL publik / eksternal
};

export type AboutMission = {
  visible?: boolean;
  left: AboutInfoCard;   // Visi
  right: AboutInfoCard;  // Misi
};

export type AboutStats = {
  visible?: boolean;
  items: AboutStatsItem[];
};

export type AboutValues = {
  visible?: boolean;
  items: AboutValueItem[];
};

export type AboutTimeline = {
  visible?: boolean;
  items: AboutTimelineItem[];
  media?: AboutTimelineMedia; // <— tambahkan media PPT (opsional)
};

export type AboutTeam = {
  visible?: boolean;
  items: AboutTeamItem[];
};

export type AboutPageContent = {
  hero: AboutHero;
  stats: AboutStats;
  mission: AboutMission;
  values: AboutValues;
  timeline: AboutTimeline; // <— gunakan tipe di atas
  team: AboutTeam;
  cta: AboutCTA;
};

// ======================== DEFAULT ABOUT ========================
export const DEFAULT_ABOUT: AboutPageContent = {
  hero: {
    visible: true,
    badge: "GRAHA KITA • Gerak Bareng Untuk Sesama",
    title: "Mewujudkan kemandirian dan kesetaraan bagi penyandang disabilitas di Indonesia.",
    subtitle:
      "Kami mempertemukan niat baik donatur dengan kebutuhan nyata di lapangan—aman, cepat, dan transparan.",
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
      desc:
        "Kami membayangkan Indonesia yang inklusif, di mana penyandang disabilitas memiliki akses dan dukungan untuk mandiri.",
      icon: "FiTarget",
      visible: true,
    },
    right: {
      badge: "Misi",
      title: "Menghubungkan kebaikan dengan dampak nyata",
      desc:
        "Menyalurkan bantuan lewat program pendidikan, kesehatan, ekonomi & alat bantu, dengan transparansi & keamanan.",
      icon: "FiCheckCircle",
      visible: true,
    },
  },
  values: {
    visible: true,
    items: [
      { title: "Integritas",  desc: "Tanggung jawab & transparansi pada setiap proses.", icon: "FiShield", visible: true },
      { title: "Empati",      desc: "Mengutamakan martabat & kebutuhan penerima manfaat.", icon: "FiHeart", visible: true },
      { title: "Profesional", desc: "Eksekusi rapi, laporan jelas, audit & compliance.",  icon: "FiAward", visible: true },
      { title: "Kolaborasi",  desc: "Bersinergi dengan mitra, relawan & komunitas.",     icon: "FiUsers", visible: true },
    ],
  },
  timeline: {
    visible: true,
    items: [
      { year: "2021", title: "Mulai dari komunitas",        desc: "Program rintisan alat bantu & kelas keterampilan kecil." },
      { year: "2022", title: "Legal & tata kelola",         desc: "SOP, pelaporan berkala, & kanal donasi digital." },
      { year: "2023", title: "Ekspansi program",            desc: "Menjangkau lebih banyak wilayah bersama mitra lokal." },
      { year: "2024", title: "Pelibatan mitra korporasi",   desc: "Kemitraan berkelanjutan & audit independen." },
    ],
    media: { pptUrl: "", caption: "" }, // default kosong; kalau ada akan dipakai di UI
  },
  team: {
    visible: true,
    items: [
      { name: "Rahma S.", role: "Program Lead",          img: null, visible: true },
      { name: "Dimas A.", role: "Partnership",           img: null, visible: true },
      { name: "Intan P.", role: "Finance & Reporting",   img: null, visible: true },
    ],
  },
  cta: {
    visible: true,
    title: "Jadikan kebaikan sebagai strategi brand Anda.",
    subtitle:
      "Hubungi kami untuk paket kemitraan, CSR, atau sponsor program. Kami siapkan eksekusi & laporan dampak.",
    primaryText: "Lihat Paket Kemitraan",
    primaryHref: "/kemitraan",
    secondaryText: "Donasi Sekarang",
    secondaryHref: "#campaigns",
  },
};
