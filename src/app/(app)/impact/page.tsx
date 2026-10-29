import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getDict, getLocale } from "@/lib/i18n";
import { getRepositories } from "@/lib/repositories";
import { authMode } from "@/lib/session";
import { computeImpact } from "@/lib/services/impact";
import { formatNumber, formatPrice } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).impact.title };
}

export default async function ImpactPage() {
  const [d, locale] = await Promise.all([getDict(), getLocale()]);
  const repos = getRepositories();
  const demo = authMode() === "demo";
  // In local mode only records created on this site count. Sample data is left out.
  const listings = (await repos.listings.list()).filter((l) => demo || !l.isDemo);
  const reservations = (await Promise.all(listings.map((l) => repos.reservations.listForListing(l.id)))).flat();
  const codes = new Set(listings.map((l) => l.batchCode));
  const bookings = (await repos.hubs.listAllBookings()).filter((b) => demo || codes.has(b.batchCode));
  const figures = computeImpact({ listings, reservations, bookings }, demo ? "demo" : "live");
  const t = d.impact;
  const listed = figures.find((f) => f.metric === "listed")?.value || 1;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{t.title}</h1>
      <p className="mt-2 text-charcoal/75">{t.intro}</p>
      <p className="mt-3 rounded-xl bg-harvest/15 p-3 text-sm font-medium">{demo ? t.banner : t.bannerLocal}</p>
      <ul className="mt-6 space-y-4">
        {figures.map((f) => {
          const [name, desc] = t.metrics[f.metric];
          const money = f.unit === "INR";
          return (
            <li key={f.metric}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-forest">{name}</h2>
                  <div className="flex gap-2">
                    <Badge tone={f.basis}>{t.basis[f.basis]}</Badge>
                    {money && f.basis !== "demo" ? null : money ? <Badge tone="demo">{t.basis.demo}</Badge> : null}
                  </div>
                </div>
                <p className="mt-1 text-3xl font-extrabold">{money ? formatPrice(f.value, locale) : `${formatNumber(f.value, locale)} ${t.kg}`}</p>
                {money ? null : (
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-forest/10" role="img" aria-label={`${name}: ${formatNumber(f.value, locale)} ${t.kg}`}>
                    <div className="h-full bg-forest" style={{ width: `${Math.min(100, (f.value / listed) * 100)}%` }} />
                  </div>
                )}
                <p className="mt-2 text-sm text-charcoal/70">{desc}</p>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
