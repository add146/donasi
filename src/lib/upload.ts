import { supabase } from "./supabase";

export async function uploadArticleImage(file: File) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('articles').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('articles').getPublicUrl(path);
  return data.publicUrl;
}
