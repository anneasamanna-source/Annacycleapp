import { Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { Dict, Locale } from "@/lib/i18n/config";
import type { HubView } from "@/lib/repositories/interfaces";
import { fill, formatNumber, formatPrice } from "@/lib/utils/format";

export function HubCard({ hub, d, locale, query }: { hub: HubView; d: Dict; locale: Locale; query: string }) {
  const h = d.hubs;
  const usedPct = Math.min(100, ((hub.capacityKg - hub.availableKg) / hub.capacityKg) * 100);
  return (
    <article className="relative flex flex-col gap-3 rounded-2xl border border-charcoal/10 bg-white p-5 transition-shadow focus-within:shadow-md hover:shadow-md">
      <div className="flex flex-wrap gap-2">
        <Badge tone="demo">{h.verification[hub.verification]}</Badge>
        <Badge>{h.types[hub.type]}</Badge>
        {hub.isConcept ? <Badge tone="estimated">{h.concept}</Badge> : null}
      </div>
      <h2 className="text-lg font-extrabold text-forest">
        <Link href={`/hubs/${hub.id}${query}`} className="after:absolute after:inset-0 after:content-['']">{hub.name}</Link>
      </h2>
      <p className="flex items-center gap-2 text-sm text-charcoal/80"><MapPin className="size-4 shrink-0" aria-hidden />{hub.place.area}, {hub.place.district}</p>
      <div>
        <div className="flex justify-between text-sm font-semibold">
          <span>{h.free}: {formatNumber(hub.availableKg, locale)} {d.common.kg}</span>
          <span className="text-charcoal/65">{h.capacity}: {formatNumber(hub.capacityKg, locale)}</span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-forest/10" role="img"
          aria-label={`${h.free}: ${formatNumber(hub.availableKg, locale)} ${d.common.kg}`}>
          <div className="h-full bg-forest" style={{ width: `${usedPct}%` }} />
        </div>
      </div>
      <ul className="space-y-1 text-sm text-charcoal/80">
        <li>{hub.storageModes.map((m) => h.modes[m]).join(" · ")}</li>
        <li className="flex items-center gap-2"><Clock className="size-4 shrink-0" aria-hidden />{hub.opensAt} – {hub.closesAt}</li>
        <li>{formatPrice(hub.costPerKgPerDay, locale)} {h.perKgDay} · {fill(h.upToDays, { n: formatNumber(hub.maxBookingDays, locale) })}</li>
      </ul>
    </article>
  );
}
