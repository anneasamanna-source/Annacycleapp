"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/config";

export function LanguageToggle({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === "en" ? "bn" : "en";

  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-charcoal/20 bg-white px-3 text-sm font-semibold text-forest transition-colors hover:bg-forest/5 disabled:opacity-60"
    >
      <Languages className="size-4" aria-hidden />
      {locale === "en" ? "বাংলা" : "English"}
    </button>
  );
}
