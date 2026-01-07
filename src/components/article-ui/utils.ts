// Utils untuk modul UI artikel
import type { Post } from "../../types/article";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(s?: string | null) {
  if (!s) return "";
  try { return new Date(s).toLocaleDateString("id-ID"); } catch { return ""; }
}

export type WithContentFallback = Partial<Post> & { content?: string | null };

export function getHtml(p: WithContentFallback) {
  return (p.content_html ?? (p as any).content ?? "") as string;
}

export function readingMinutesFromHtml(html: string) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / 200)); // ~200 wpm
}
