"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MOBILE_PRIMARY, NAV_ITEMS, isActive } from "@/lib/nav";
import type { Dict } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";

export function MobileNav({ labels, moreLabel }: { labels: Dict["nav"]; moreLabel: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the "More" sheet after navigating.
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const primary = NAV_ITEMS.filter((i) => MOBILE_PRIMARY.includes(i.key));
  const more = NAV_ITEMS.filter((i) => !MOBILE_PRIMARY.includes(i.key));

  return (
    <>
      {open ? (
        <div
          id="more-menu"
          className="fixed inset-x-3 bottom-20 z-40 rounded-2xl border border-charcoal/10 bg-white p-2 shadow-lg lg:hidden"
        >
          {more.map(({ key, href, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold text-forest hover:bg-forest/5"
            >
              <Icon className="size-5" aria-hidden />
              {labels[key]}
            </Link>
          ))}
        </div>
      ) : null}

      <nav
        aria-label={labels.main}
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-charcoal/10 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {primary.map(({ key, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                active ? "text-forest" : "text-charcoal/70",
              )}
            >
              <Icon className={cn("size-5", active && "text-forest")} aria-hidden />
              {labels[key]}
            </Link>
          );
        })}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="more-menu"
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-charcoal/70"
        >
          <Menu className="size-5" aria-hidden />
          {moreLabel}
        </button>
      </nav>
    </>
  );
}
