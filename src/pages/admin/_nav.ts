// src/pages/admin/_nav.ts
import {
  LayoutDashboard,
  UsersRound,
  Megaphone,
  Image as ImageIcon,
  ListChecks,
  FileText,
  Settings,
  Info,         // ← tambahkan ini
  BookOpen,     // ← opsional: dipakai untuk "Kisah Harapan"
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export const NAV: NavItem[] = [
  { to: '/admin/halaman', label: 'Halaman', icon: FileText },
  { to: "/admin/partners",   label: "Kemitraan",        icon: UsersRound },
  { to: "/admin/campaigns",  label: "Campaigns",        icon: Megaphone },
  { to: "/admin/stories",    label: "Kisah Harapan",    icon: BookOpen },     // boleh tetap LayoutDashboard kalau mau
  { to: "/admin/gallery",    label: "Galeri",           icon: ImageIcon },
  { to: "/admin/articles",   label: "Artikel",          icon: FileText },
  { to: "/admin/banners",    label: "Banners",          icon: ImageIcon },
  { to: "/admin/howitworks", label: "Cara Kerja",       icon: ListChecks },
  { to: "/admin/settings",   label: "Pengaturan",       icon: Settings },
  { to: "/admin/about",      label: "About (Konten)",   icon: Info },         // ← ini yang tadi error
];
