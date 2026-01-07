/**
 * src/types/article.ts
 * Types for Articles
 * - Used across admin list/editor and public page.
 */
export type PostStatus = "draft" | "published";

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  content_html: string;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};