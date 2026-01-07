// src/components/banners/Banner.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { storagePublicUrl } from "../../lib/storage";

type Slot =
  | "article_inline"
  | "article_footer"
  | "sidebar_top"
  | "sidebar_middle"
  | "sidebar_bottom"
  | "home_between_sections";

type BannerRow = {
  id: string;
  image_url: string | null;
  link_url: string | null;
  slots: string[] | null;
  status: "draft" | "active";
  start_at: string | null;
  end_at: string | null;
  weight: number | null;
};

type Props = {
  slot: Slot;
  /** Kelas tambahan opsional untuk container pembungkus */
  className?: string;
  /** Paksa pakai URL tertentu (skip fetch) */
  imageUrl?: string | null;
  /** Paksa pakai link tertentu (skip link_url dari DB) */
  linkUrl?: string | null;
};

export default function Banner({ slot, className = "", imageUrl, linkUrl }: Props) {
  const [row, setRow] = useState<BannerRow | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (imageUrl) {
        // Kalau dikasih imageUrl langsung, nggak perlu fetch
        setRow({
          id: "inline",
          image_url: imageUrl,
          link_url: linkUrl ?? null,
          slots: [slot],
          status: "active",
          start_at: null,
          end_at: null,
          weight: 1,
        });
        return;
      }

      const now = new Date().toISOString();

      // Filter: aktif, mengandung slot, dalam rentang jadwal
      // Catatan: .or() menggabungkan kondisi OR secara string.
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("status", "active")
        .contains("slots", [slot])
        .or(`start_at.is.null,start_at.lte.${now}`)
        .or(`end_at.is.null,end_at.gte.${now}`)
        .order("weight", { ascending: true })
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!alive) return;
      if (!error) setRow((data as BannerRow) || null);
    })();

    return () => {
      alive = false;
    };
  }, [slot, imageUrl, linkUrl]);

  if (!row || !row.image_url) return null;

  const src = storagePublicUrl(row.image_url, "publicimages") || row.image_url;
  const Wrapper = row.link_url ? "a" : "div";
  const wrapperProps = row.link_url
    ? { href: row.link_url, target: "_blank", rel: "noopener" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`block overflow-hidden rounded-2xl border bg-white shadow-sm ${className}`}
      aria-label="Banner"
    >
      {/* Full image, tanpa caption/footer di bawahnya */}
      <img src={src} alt="" className="h-auto w-full object-cover" />
    </Wrapper>
  );
}
