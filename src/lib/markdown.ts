import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function renderMarkdownSafe(md: string) {
  const raw = marked.parse(md ?? '');
  // @ts-ignore: DOMPurify di browser; saat SSR/Edge, sesuaikan jika perlu
  const clean = DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });
  return clean as string;
}
