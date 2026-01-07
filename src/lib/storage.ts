// src/lib/storage.ts
import { supabase } from "./supabase";

// Ambil base URL Supabase dari env Vite (contoh: https://xxxx.supabase.co)
const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL || "";

export function storagePublicUrl(
  raw?: string | null,
  defaultBucket = "publicimages",
): string | null {
  if (!raw) return null;

  // Normalisasi: trim & backslash -> slash
  const val = String(raw).trim().replace(/\\/g, "/");

  // Sudah http(s) → pakai apa adanya
  if (/^https?:\/\//i.test(val)) return val;

  const cleaned = val.replace(/^\/+/, "");

  // Sudah path publik Supabase (tanpa domain)
  // e.g. storage/v1/object/public/publicimages/xxx.jpg
  if (cleaned.startsWith("storage/v1/object/public/")) {
    return SUPABASE_URL ? `${SUPABASE_URL}/${cleaned}` : `/${cleaned}`;
  }

  // Bentuk "<bucket>/path/ke/file.jpg"
  const firstSlash = cleaned.indexOf("/");
  if (firstSlash > -1) {
    const bucket = cleaned.slice(0, firstSlash);
    const path = cleaned.slice(firstSlash + 1);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl || null;
  }

  // Bentuk "articles/x.jpg" atau "Adi.jpg" (asumsi dalam bucket default)
  const { data } = supabase.storage.from(defaultBucket).getPublicUrl(cleaned);
  return data.publicUrl || null;
}
