import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Row = {
  id: string;
  name: string;
  quote: string;
  avatar_url?: string | null;
  avatar?: string | null;
};

const DEFAULT_AVATAR =
  "https://placehold.co/120x120/EDEFF2/9AA3AF?text=%F0%9F%91%A5";

export default function StoriesMini() {
  const [row, setRow] = useState<Row | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("stories")
        .select("id,name,quote,avatar_url,avatar")
        .eq("status", "published")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;
      setRow(data ?? null);
    })();
    return () => void (mounted = false);
  }, []);

  if (!row) return null;

  // normalisasi avatar → URL publik
  let avatar = DEFAULT_AVATAR;
  const raw = row.avatar_url ?? row.avatar ?? "";
  if (raw) {
    if (/^https?:\/\//i.test(raw)) {
      avatar = raw;
    } else {
      const { data } = supabase.storage.from("publicimages").getPublicUrl(raw);
      avatar = data.publicUrl || DEFAULT_AVATAR;
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-md p-6 md:p-8">
      <div className="text-3xl text-amber-400 -mt-2 mb-2 select-none">“</div>
      <p className="text-slate-700 italic leading-relaxed">{row.quote}</p>
      <div className="mt-5 flex items-center gap-3">
        <img
          src={avatar}
          onError={(e) => ((e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR)}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow"
          alt={row.name}
        />
        <span className="text-sm text-slate-500">{row.name}</span>
      </div>
    </div>
  );
}
