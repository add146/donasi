// src/types/campaign.ts
export type Campaign = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string; // bisa plain text atau HTML
  hero_image_url: string | null;
  location: string | null;
  organizer: string | null;
  target_amount: number;
  raised_amount: number;
  status: "draft" | "published" | "archived";
  category?: string | null;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

// ===== util kecil yang sering dipakai =====
export function formatCurrency(idr: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(idr);
}

export function percent(raised: number, target: number) {
  if (!target) return 0;
  const p = Math.floor((raised / target) * 100);
  return Math.min(100, Math.max(0, p));
}

export function truncate(text: string | null | undefined, n: number) {
  if (!text) return "";
  return text.length <= n ? text : text.slice(0, n - 1) + "…";
}
