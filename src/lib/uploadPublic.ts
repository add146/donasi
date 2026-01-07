// src/lib/uploadPublic.ts
import { supabase } from "./supabase";

function randomId(n = 8) {
  return Math.random().toString(36).slice(2, 2 + n);
}

/**
 * Upload image ke bucket "publicimages" dan kembalikan URL publiknya.
 * @param file File gambar
 * @param folder subfolder (mis. 'logos')
 * @returns public URL (string)
 */
export async function uploadPublicImage(file: File, folder = "logos"): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${folder}/${Date.now()}-${randomId()}.${ext}`;

  const { error } = await supabase.storage.from("publicimages").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("publicimages").getPublicUrl(path);
  return data.publicUrl; // langsung URL publik
}

/** Upload file apapun (PDF, dll) ke folder publik */
export async function uploadPublicFile(file: File, folder = "files"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage.from("public").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return data?.path || path;
}

/** Terima path atau URL, lalu kembalikan URL publik */
export function ensurePublicUrl(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  // jika suatu saat kamu simpan path, tinggal getPublicUrl di sini
  const { data } = supabase.storage.from("publicimages").getPublicUrl(String(pathOrUrl));
  return data.publicUrl;
}
