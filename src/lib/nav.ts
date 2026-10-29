import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  PlusCircle,
  Recycle,
  Settings,
  Store,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type NavKey =
  | "dashboard"
  | "marketplace"
  | "surplusNew"
  | "hubs"
  | "recovery"
  | "batches"
  | "impact"
  | "settings";

export const NAV_ITEMS: { key: NavKey; href: string; icon: LucideIcon }[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "marketplace", href: "/marketplace", icon: Store },
  { key: "surplusNew", href: "/surplus/new", icon: PlusCircle },
  { key: "hubs", href: "/hubs", icon: Warehouse },
  { key: "recovery", href: "/recovery", icon: Recycle },
  { key: "batches", href: "/batches", icon: Boxes },
  { key: "impact", href: "/impact", icon: BarChart3 },
  { key: "settings", href: "/settings", icon: Settings },
];

/** Shown in the mobile bottom bar. The rest go behind the "More" button. */
export const MOBILE_PRIMARY: NavKey[] = ["dashboard", "marketplace", "hubs", "recovery"];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
