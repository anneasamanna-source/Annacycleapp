"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "@/lib/nav";
import type { Dict } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";
import { Logo } from "./Logo";

export function Sidebar({ labels, tagline }: { labels: Dict["nav"]; tagline: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-charcoal/10 bg-white px-4 py-6 lg:flex">
      <Link href="/" className="px-2" aria-label="ANNA CYCLE">
        <Logo />
      </Link>
      <nav aria-label={labels.main} className="mt-8 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                active ? "bg-forest text-ivory" : "text-charcoal/80 hover:bg-forest/5 hover:text-forest",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {labels[key]}
            </Link>
          );
        })}
      </nav>
      <p className="px-2 text-[11px] font-bold tracking-[0.16em] text-charcoal/60">{tagline}</p>
    </aside>
  );
}
