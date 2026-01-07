export type BannerStatus = 'draft' | 'active' | 'archived';

export interface Banner {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  slots: string[];           // contoh: ["article_inline","sidebar_top"]
  weight: number;            // default 1
  status: BannerStatus;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}
