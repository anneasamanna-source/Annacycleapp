import { Plus } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import type { Dict, Locale } from "@/lib/i18n/config";
import type { User } from "@/lib/domain/types";
import { AccountControl } from "./AccountControl";
import { LanguageToggle } from "./LanguageToggle";
import { Logo } from "./Logo";

export function TopBar({ locale, d, viewer, showAccount }: { locale: Locale; d: Dict; viewer: User | null; showAccount: boolean }) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-charcoal/10 bg-ivory/90 px-4 backdrop-blur sm:px-8">
      <Link href="/" aria-label="ANNA CYCLE" className="lg:hidden">
        <Logo />
      </Link>
      <span className="hidden lg:block" />
      <div className="flex items-center gap-2">
        <LanguageToggle locale={locale} label={d.common.language} />
        {showAccount ? <AccountControl viewer={viewer} d={d} /> : null}
        <ButtonLink href="/surplus/new" variant="accent">
          <Plus className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">{d.common.listSurplus}</span>
        </ButtonLink>
      </div>
    </header>
  );
}
