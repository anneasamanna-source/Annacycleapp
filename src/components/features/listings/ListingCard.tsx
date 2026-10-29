import { Clock, MapPin, Sprout } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { getCropProfile } from "@/lib/domain/crop-profiles";
import type { Dict, Locale } from "@/lib/i18n/config";
import type { ListingView } from "@/lib/repositories/interfaces";
import { fill, formatNumber, formatPrice, hoursUntil, relativeTime } from "@/lib/utils/format";

export function ListingCard({ l, locale, d }: { l: ListingView; locale: Locale; d: Dict }) {
  const m = d.market;
  const name = locale === "bn" ? getCropProfile(l.cropKey).nameBn : l.produceName;
  const urgent = l.status === "active" && hoursUntil(l.recoverBy) < 12;
  const availTone = l.availability === "available" ? "ok" : l.availability === "partly_reserved" ? "estimated" : "neutral";

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white transition-shadow focus-within:shadow-md hover:shadow-md">
      <div className="flex h-44 items-center justify-center bg-ivory p-4">
        {l.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.photoUrl} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
        ) : (
          <Sprout className="size-12 text-forest/40" aria-hidden />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-2">
          {l.isDemo ? <Badge tone="demo">{d.common.demoData}</Badge> : null}
          <Badge tone={availTone}>{m.availability[l.availability]}</Badge>
          {urgent ? <Badge tone="caution">{m.card.timeSensitive}</Badge> : null}
        </div>
        <h2 className="text-xl font-extrabold text-forest">
          <Link
            href={`/marketplace/${l.id}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {name}
          </Link>
        </h2>
        <p>
          <span className="text-2xl font-extrabold">{formatPrice(l.askingPricePerKg, locale)}</span>{" "}
          <span className="text-sm text-charcoal/70">{m.card.perKg}</span>
        </p>
        <p className="text-sm font-semibold">
          {fill(m.card.availableOf, { a: formatNumber(l.availableKg, locale), t: formatNumber(l.totalKg, locale) })}
        </p>
        <ul className="mt-auto space-y-1.5 text-sm text-charcoal/80">
          <li className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {l.place.area}, {l.place.district}
          </li>
          <li className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" aria-hidden />
            {m.card.recoverBy} {relativeTime(l.recoverBy, locale)}
          </li>
          <li>
            <span className="font-semibold">{m.conditions[l.reportedCondition]}</span> · {m.card.reported}{" "}
            {relativeTime(l.conditionReportedAt, locale)}
          </li>
        </ul>
      </div>
    </article>
  );
}
