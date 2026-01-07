import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Campaign, formatCurrency, percent, truncate } from "../types/campaign";
import DonationCard from "../components/DonationCard";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CampaignDetail() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();

  const [row, setRow] = useState<Campaign | null>(null);
  const [others, setOthers] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [tried, setTried] = useState(false); // penanda sudah mencoba fetch

  useEffect(() => {
    let mounted = true;
    const slugNormalized = decodeURIComponent(slug).trim();

    async function load() {
      setLoading(true);
      setTried(false);

      // 1) Ambil detail
      const detailRes = await supabase
  .from("campaigns")
  .select("*")
  .eq("slug", slug)
  .eq("status", "published")
  .maybeSingle();



      if (!mounted) return;

      if (detailRes.error) {
        console.error("campaign detail error:", detailRes.error);
        setRow(null);
        setOthers([]);
        setLoading(false);
        setTried(true);
        return;
      }

      if (!detailRes.data) {
        // tidak ada baris untuk slug ini
        setRow(null);
        setOthers([]);
        setLoading(false);
        setTried(true);
        return;
      }

      setRow(detailRes.data as Campaign);

      // 2) Ambil campaign lain
      const { data: more, error: moreErr } = await supabase
        .from("campaigns")
        .select(
          "id,slug,title,summary,hero_image_url,raised_amount,target_amount,updated_at"
        )
        .neq("id", detailRes.data.id)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(4);

      if (moreErr) {
        console.warn("campaign others error:", moreErr);
        setOthers([]);
      } else {
        setOthers((more ?? []) as Campaign[]);
      }

      setLoading(false);
      setTried(true);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const progress = useMemo(
    () => percent(row?.raised_amount ?? 0, row?.target_amount ?? 0),
    [row]
  );

  // === SKELETON saat loading ===
  if (loading && !tried) {
    return (
      <section className="py-16">
        <div className="container-app">
          <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="grid lg:grid-cols-[1fr,360px] gap-8 mt-8">
            <div className="space-y-4">
              <div className="h-6 w-64 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-60 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  // === BENAR-BENAR NOT FOUND (sudah mencoba fetch & tidak dapat data) ===
  if (!row && tried) {
    return (
      <section className="py-24 text-center">
        <h2 className="text-2xl font-bold mb-2">Campaign tidak ditemukan</h2>
        <p className="text-gray-500">Slug: {decodeURIComponent(slug).trim()}</p>
        <button className="btn-primary mt-6 px-5 py-2" onClick={() => navigate(-1)}>
          Kembali
        </button>
      </section>
    );
  }

  // safety
  if (!row) return null;

  return (
     <>
          <Header />
    <article className="pb-20">
      {/* HERO */}
      <div className="relative h-[360px] md:h-[420px] lg:h-[500px]">
        <img
          src={
            row.hero_image_url ||
            "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1974&auto=format&fit=crop"
          }
          alt={row.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 container-app pb-8">
          <h1 className="text-white text-3xl md:text-4xl font-extrabold drop-shadow">
            {row.title}
          </h1>
          {(row.location || row.organizer) && (
            <p className="text-white/90 mt-2">
              {row.location ? row.location + " • " : ""}
              {row.organizer ?? ""}
            </p>
          )}
        </div>
      </div>

      <div className="container-app mt-10 grid lg:grid-cols-[1fr,360px] gap-8">
        {/* KONTEN */}
        <section>
          {row.summary && (
            <p className="text-lg text-gray-700 leading-7 mb-6">{row.summary}</p>
          )}

          {/\<\w+/.test(row.content) ? (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: row.content }}
            />
          ) : (
            <div className="space-y-4 text-gray-800 leading-7">
              {row.content.split("\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          {/* SHARE */}
          <div className="mt-12 border-t pt-6">
            <h3 className="text-xl font-semibold mb-3">Bagikan campaign ini</h3>
            <div className="flex flex-wrap gap-3">
              <a
                className="btn px-4 py-2 rounded-full bg-[#25D366] text-white hover:opacity-90"
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${row.title} — ${shareUrl}`
                )}`}
                target="_blank"
              >
                WhatsApp
              </a>
              <a
                className="btn px-4 py-2 rounded-full bg-[#1DA1F2] text-white hover:opacity-90"
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  shareUrl
                )}&text=${encodeURIComponent(row.title)}`}
                target="_blank"
              >
                X / Twitter
              </a>
              <a
                className="btn px-4 py-2 rounded-full bg-[#1877F2] text-white hover:opacity-90"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  shareUrl
                )}`}
                target="_blank"
              >
                Facebook
              </a>
              <button
                className="btn px-4 py-2 rounded-full border hover:bg-gray-50"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    alert("Tautan disalin ke papan klip.");
                  } catch {
                    alert("Gagal menyalin tautan.");
                  }
                }}
              >
                Salin Tautan
              </button>
            </div>
          </div>

          {/* LAINNYA */}
          {others.length > 0 && (
            <section className="mt-14">
              <h3 className="text-xl font-semibold mb-4">Campaign lain</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {others.map((c) => (
                  <a
                    key={c.id}
                    href={`/campaign/${c.slug}`}
                    className="group rounded-2xl border overflow-hidden bg-white hover:shadow-md transition"
                  >
                    <div className="h-40 w-full overflow-hidden">
                      <img
                        src={
                          c.hero_image_url ||
                          "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1974&auto=format&fit=crop"
                        }
                        alt={c.title}
                        className="h-full w-full object-cover group-hover:scale-[1.02] transition"
                      />
                    </div>
                    <div className="p-4">
                      <div className="font-semibold">
                        {truncate(c.title, 60)}
                      </div>
                      <div className="mt-2">
                        <Progress tiny raised={c.raised_amount} target={c.target_amount} />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </section>

        {/* SIDEBAR */}
        <aside className="lg:pt-2">
  <DonationCard
    target={row?.target_amount ?? 0}
    raised={row?.raised_amount ?? 0}
    onDonate={() => navigate(`/donate/${row?.slug}`)}
    backLabel="Kembali"
  />

  {(row?.location || row?.organizer) && (
    <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 ring-1 ring-gray-200">
      {row?.organizer && (
        <div>
          <span className="font-medium text-gray-800">Penyelenggara: </span>
          {row.organizer}
        </div>
      )}
      {row?.location && (
        <div>
          <span className="font-medium text-gray-800">Lokasi: </span>
          {row.location}
        </div>
      )}
    </div>
  )}
</aside>

      </div>
    </article>
    <Footer />
    </>
  );
}

function Progress({
  raised,
  target,
  tiny,
}: {
  raised: number;
  target: number;
  tiny?: boolean;
}) {
  const p = percent(raised, target);
  return (
    <div className={tiny ? "h-2 bg-gray-200 rounded-full" : "h-3 bg-gray-200 rounded-full"}>
      <div
        className={tiny ? "h-2 rounded-full bg-brand-primary" : "h-3 rounded-full bg-brand-primary"}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}
