/**
 * SocialShare.tsx — tombol share premium (FIXED)
 * ----------------------------------------------
 * - Warna FB & LinkedIn pakai HEX supaya tidak kepurge Tailwind
 * - Layout konsisten, tanpa tombol kosong
 */
import { useMemo, useState } from "react";

export default function SocialShare({
  url,
  title,
  text,
}: {
  url?: string;
  title: string;
  text?: string;
}) {
  const href = useMemo(() => url || (typeof window !== "undefined" ? window.location.href : ""), [url]);
  const encodedUrl = encodeURIComponent(href);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text || "");

  const links = [
    // pakai warna HEX agar aman dari purge
    { name: "WhatsApp", href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`, style: { backgroundColor: "#059669" } }, // emerald-600
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, style: { backgroundColor: "#1877F2" } },
    { name: "X",        href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, style: { backgroundColor: "#0F1419" } },
    { name: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, style: { backgroundColor: "#229ED9" } },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, style: { backgroundColor: "#0A66C2" } },
  ];

  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function webShare() {
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title, text, url: href }); } catch {}
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(navigator as any).share && (
        <button
          onClick={webShare}
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow"
          style={{ backgroundColor: "#F59E0B" }} // amber-500
        >
          Bagikan
        </button>
      )}

      {links.map(l => (
        <a
          key={l.name}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow hover:opacity-95"
          style={l.style}
        >
          {l.name}
        </a>
      ))}

      <button
        onClick={copy}
        className="rounded-full border px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
      >
        {copied ? "Tersalin ✓" : "Salin Link"}
      </button>
    </div>
  );
}
