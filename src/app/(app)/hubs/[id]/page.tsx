import { ArrowLeft, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/features/hubs/BookingForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getCropProfile } from "@/lib/domain/crop-profiles";
import { authMode, getViewer } from "@/lib/session";
import { ButtonLink } from "@/components/ui/Button";
import { getDict, getLocale } from "@/lib/i18n";
import { getRepositories } from "@/lib/repositories";
import { formatNumber, formatPrice } from "@/lib/utils/format";

type P = { params: Promise<{ id: string }>; searchParams: Promise<{ listing?: string }> };

export async function generateMetadata({ params }: Pick<P, "params">): Promise<Metadata> {
  return { title: (await getRepositories().hubs.getById((await params).id))?.name ?? "Hub" };
}

export default async function HubPage({ params, searchParams }: P) {
  const [{ id }, sp, d, locale, me] = await Promise.all([params, searchParams, getDict(), getLocale(), getViewer()]);
  const repos = getRepositories();
  const hub = await repos.hubs.getById(id);
  if (!hub) notFound();
  const h = d.hubs;
  const mine = me?.role === "vendor" ? (await repos.listings.list({ onlyAvailable: false })).filter((l) => l.sellerId === me?.id && l.status === "active") : [];
  const batches = mine.map((l) => ({ value: l.batchCode, label: `${l.batchCode} · ${locale === "bn" ? getCropProfile(l.cropKey).nameBn : l.produceName} · ${formatNumber(l.totalKg, locale)} ${d.common.kg}` }));
  const defaultBatch = mine.find((l) => l.id === sp.listing)?.batchCode;
  const n = (x: number) => formatNumber(x, locale);
  const facts: [string, string][] = [
    [h.location, `${hub.place.area}, ${hub.place.district}`],
    [h.capacity, `${n(hub.capacityKg)} ${d.common.kg} · ${h.free}: ${n(hub.availableKg)} ${d.common.kg}`],
    [h.storage, hub.storageModes.map((m) => h.modes[m]).join(", ")],
    [h.accepts, hub.acceptedCategories.map((c) => d.market.categories[c]).join(", ")],
    [h.hours, `${hub.opensAt} – ${hub.closesAt}`],
    [h.cost, `${formatPrice(hub.costPerKgPerDay, locale)} ${h.perKgDay}`],
    [h.maxStay, h.upToDays.replace("{n}", n(hub.maxBookingDays))],
  ];
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/hubs" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-forest hover:underline"><ArrowLeft className="size-4" aria-hidden />{h.back}</Link>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge tone="demo">{h.verification[hub.verification]}</Badge><Badge>{h.types[hub.type]}</Badge>
        {hub.isConcept ? <Badge tone="estimated">{h.concept}</Badge> : null}
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-forest">{hub.name}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <dl className="divide-y divide-charcoal/10">
            {facts.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[8rem_1fr]"><dt className="text-sm font-semibold text-charcoal/70">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <p className="mt-4 flex gap-2 text-sm text-charcoal/70"><Info className="mt-0.5 size-4 shrink-0" aria-hidden />{h.notGuarantee}</p>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-forest">{h.bookTitle}</h2>
          {!me ? <div className="space-y-3"><p className="text-sm text-charcoal/75">{d.auth.signInToAct}</p><ButtonLink href="/login">{d.auth.login}</ButtonLink></div>
            : me.role !== "vendor" ? <p className="text-sm text-charcoal/75">{authMode() === "demo" ? h.viewAsVendor : h.errors.notVendor}</p>
            : batches.length === 0 ? <p className="text-sm text-charcoal/75">{h.noBatches}</p>
            : (<><p className="text-sm text-charcoal/75">{h.bookIntro}</p><BookingForm hubId={hub.id} batches={batches} defaultBatch={defaultBatch} t={h} locale={locale} /></>)}
        </Card>
      </div>
    </div>
  );
}
