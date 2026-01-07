import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import CampaignCard from "./CampaignCard";
import CampaignCardSmall from "./CampaignCardSmall";
import type { Campaign } from "../types/campaign";

type Row = {
  id: string | number;
  slug: string | null;
  title: string | null;
  summary?: string | null;
  hero_image_url?: string | null;
  target_amount?: number | null;
  raised_amount?: number | null;
  category?: string | null;
  published_at?: string | null;
};

function isUrgentCat(cat?: string | null) {
  const v = (cat ?? "").toString().trim().toLowerCase();
  return v === "mendesak" || v === "urgent" || v === "darurat";
}

function normalizeCampaign(r: Row): Campaign {
  return {
    id: r.id as any,
    slug: String(r.slug ?? ""),
    title: String(r.title ?? ""),
    summary: String(r.summary ?? ""),
    hero_image_url: String(r.hero_image_url ?? ""),
    target_amount: Number.isFinite(r.target_amount as any) ? Number(r.target_amount) : 0,
    raised_amount: Number.isFinite(r.raised_amount as any) ? Number(r.raised_amount) : 0,
    category: (r.category ?? "lainnya").toString(),
  } as Campaign;
}

export default function Campaigns() {
  const [urgent, setUrgent] = useState<Campaign[]>([]);
  const [others, setOthers] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("campaigns")
        .select(
          "id, slug, title, summary, hero_image_url, target_amount, raised_amount, category, published_at"
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(30);

      if (!alive) return;

      if (error) {
        console.error("Failed to load campaigns:", error);
        setUrgent([]);
        setOthers([]);
        setLoading(false);
        return;
      }

      const all = (data ?? []).map(normalizeCampaign);

      let urg = all.filter((c) => isUrgentCat(c.category));
      let oth = all.filter((c) => !isUrgentCat(c.category));

      if (urg.length < 3) {
        const needs = 3 - urg.length;
        urg = urg.concat(oth.slice(0, needs));
        oth = oth.slice(needs);
      }

      const urgentIds = new Set(urg.map((u) => u.id));

      setUrgent(urg.slice(0, 3));
      setOthers(oth.filter((o) => !urgentIds.has(o.id)).slice(0, 4));
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="campaigns" className="py-16">
      <div className="container-app">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Campaign Pilihan</h2>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
            Campaign Mendesak Yang Membutuhkan Bantuan Anda.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-200" />
                <div className="p-5">
                  <div className="h-5 w-4/5 bg-gray-200 rounded" />
                  <div className="mt-2 h-4 w-full bg-gray-200 rounded" />
                  <div className="mt-1 h-4 w-2/3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}

          {!loading &&
            urgent.map((c) => (
              <CampaignCard
  key={c.id}
  title={c.title}
  summary={c.summary ?? ""}
  image={c.hero_image_url ?? ""}
  target_amount={c.target_amount}
  raised_amount={c.raised_amount}
  slug={c.slug}
  category={String(c.category ?? "")}
/>

            ))}
        </div>

        {!loading && others.length > 0 && (
          <>
            <h3 className="mt-12 text-lg font-semibold text-center md:text-left">Campaign lainnya</h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((c) => (
                <CampaignCardSmall
                  key={c.id}
                  title={c.title}
                  image={c.hero_image_url || ""}
                  target_amount={c.target_amount}
                  raised_amount={c.raised_amount}
                  slug={c.slug}
                />
              ))}
            </div>
          </>
        )}

        {!loading && urgent.length === 0 && (
          <div className="mt-6 text-gray-500 text-sm text-center">
            Belum ada campaign yang ditampilkan.
          </div>
        )}
      </div>
    </section>
  );
}
