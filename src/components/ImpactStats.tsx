import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ImpactContent } from "../types/siteContent";

// fallback awal biar ada konten
const DEFAULT_IMPACT: ImpactContent = {
  fundRaised: 1200000000, // Rp 1.2 M
  donors: 8500,
  beneficiaries: 350,
};

// Rp singkat: 20.0 Juta+, 1.2 Miliar+
function formatIDRShort(n: number, opts?: { withRp?: boolean; withPlus?: boolean }) {
  const value = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;

  let text: string;
  if (value >= 1_000_000_000) {
    // bulatkan ke Miliar tanpa desimal
    text = `${Math.round(value / 1_000_000_000)} Miliar`;
  } else if (value >= 1_000_000) {
    // bulatkan ke Juta tanpa desimal
    text = `${Math.round(value / 1_000_000)} Juta`;
  } else {
    text = new Intl.NumberFormat("id-ID").format(value);
  }

  const withRp = opts?.withRp !== false;   // default: pakai "Rp"
  const withPlus = !!opts?.withPlus;       // default: tidak pakai "+"

  return `${withRp ? "Rp " : ""}${text}${withPlus ? "+" : ""}`;
}

// Count singkat: 12.3 Juta+, 12.0 Ribu+, dst
function formatCountShort(n: number) {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} Miliar+`;
  if (abs >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)} Juta+`;
  if (abs >= 1_000)         return `${(n / 1_000).toFixed(1)} Ribu+`;
  return `${new Intl.NumberFormat("id-ID").format(n)}+`;
}

export default function ImpactStats() {
  const [val, setVal] = useState<ImpactContent>(DEFAULT_IMPACT);

  useEffect(() => {
    // fetch sekali
    supabase
      .from("site_content")
      .select("data")
      .eq("key", "impact")
      .maybeSingle()
      .then((res) => {
        const d = (res.data?.data as ImpactContent) || null;
        if (d) {
          setVal({
            fundRaised: Number(d.fundRaised ?? DEFAULT_IMPACT.fundRaised),
            donors: Number(d.donors ?? DEFAULT_IMPACT.donors),
            beneficiaries: Number(d.beneficiaries ?? DEFAULT_IMPACT.beneficiaries),
          });
        }
      });

    // optional realtime
    const ch = supabase
      .channel("site_content_impact")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "site_content", filter: "key=eq.impact" },
        (payload: any) => {
          const d = payload?.new?.data || {};
          setVal({
            fundRaised: Number(d.fundRaised ?? DEFAULT_IMPACT.fundRaised),
            donors: Number(d.donors ?? DEFAULT_IMPACT.donors),
            beneficiaries: Number(d.beneficiaries ?? DEFAULT_IMPACT.beneficiaries),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <section id="impact" className="bg-gradient-to-b from-white to-white/70">
      <div className="container-app">
        <div className="rounded-3xl bg-white/90 backdrop-blur shadow-lg ring-1 ring-black/5 p-6 md:p-10 -mt-10 md:-mt-16 relative z-10">
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <StatCard
              icon="💛"
              label="Dana Terkumpul"
              value={formatIDRShort(val.fundRaised)}
            />
            <StatCard
              icon="👥"
              label="Donatur Baik Hati"
              value={formatCountShort(Number(val.donors ?? 0))}
            />
            <StatCard
              icon="🤝"
              label="Penerima Manfaat"
              value={formatCountShort(Number(val.beneficiaries ?? 0))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="h-12 w-12 rounded-2xl grid place-items-center bg-brand-primary/10 text-brand-primary text-2xl">
        {icon}
      </div>
      <div>
        <div className="text-[22px] md:text-[24px] font-semibold text-brand-primary">
          {value}
        </div>
        <div className="text-gray-600">{label}</div>
      </div>
    </div>
  );
}
