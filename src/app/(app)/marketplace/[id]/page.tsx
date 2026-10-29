import { ArrowLeft, Info, Warehouse } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReservationPanel } from "@/components/features/listings/ReservationPanel";
import { QuantityBar } from "@/components/features/listings/QuantityBar";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCropProfile } from "@/lib/domain/crop-profiles";
import { getViewer } from "@/lib/session";
import { getDict, getLocale } from "@/lib/i18n";
import { getRepositories } from "@/lib/repositories";
import { fill, formatDateTime, formatNumber, formatPrice, relativeTime } from "@/lib/utils/format";

type Params = { params: Promise<{ id: string }> };
type PageProps = Params & { searchParams: Promise<{ reserved?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const l = await getRepositories().listings.getById((await params).id);
  return { title: l?.produceName ?? (await getDict()).market.detail.notFoundTitle };
}

export default async function ListingPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const justReserved = Number((await searchParams).reserved);
  const [d, locale, me] = await Promise.all([getDict(), getLocale(), getViewer()]);
  const repos = getRepositories();
  const l = await repos.listings.getById(id);
  if (!l) notFound();

  const reservations = await repos.reservations.listForListing(l.id);
  const isSeller = !!me && me.id === l.sellerId;
  // Buyer names are shown only to the seller. Everyone else sees amounts and statuses, with "You" on their own.
  const buyerNames: Record<string, string> = {};
  if (isSeller) for (const r of reservations) buyerNames[r.buyerId] = (await repos.users.getById(r.buyerId))?.name ?? "—";
  const m = d.market;
  const t = m.detail;
  const crop = getCropProfile(l.cropKey);
  const name = locale === "bn" ? crop.nameBn : l.produceName;
  const kg = (n: number) => `${formatNumber(n, locale)} ${d.common.kg}`;
  const when = (iso?: string) => (iso ? `${formatDateTime(iso, locale)} (${relativeTime(iso, locale)})` : t.unknown);

  const facts: [string, string][] = [
    [t.location, `${l.place.area}, ${l.place.district}`],
    [t.harvested, when(l.harvestedAt)],
    [t.purchased, when(l.purchasedAt)],
    [t.storageHistory, l.storageHistory ?? t.unknown],
    [t.collectionWindow, `${formatDateTime(l.collectionFrom, locale)} ${t.to} ${formatDateTime(l.collectionUntil, locale)}`],
    [t.recoverBy, when(l.recoverBy)],
    [t.seller, `${l.seller.name}, ${l.seller.district}`],
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/marketplace" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-forest hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        {t.back}
      </Link>

      {Number.isFinite(justReserved) && justReserved > 0 ? (
        <p role="status" className="mt-2 rounded-xl bg-forest/10 p-3 font-semibold text-forest">
          {fill(d.reserve.success, { q: formatNumber(justReserved, locale) })}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {l.isDemo ? <Badge tone="demo">{d.common.demoData}</Badge> : null}
        <Badge>{t.batch} {l.batchCode}</Badge>
        <Badge tone={l.status === "active" ? "ok" : "neutral"}>{t.listingStatus[l.status]}</Badge>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">{name}</h1>
      <p className="mt-1 text-lg">
        <span className="font-extrabold">{formatPrice(l.askingPricePerKg, locale)}</span>{" "}
        <span className="text-charcoal/70">{m.card.perKg}</span>
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <div className="flex min-h-72 items-center justify-center rounded-2xl bg-ivory p-6 ring-1 ring-charcoal/10">
            {l.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.photoUrl} alt={name} className="max-h-64 max-w-full object-contain" />
            ) : (
              <p className="text-sm text-charcoal/60">{t.unknown}</p>
            )}
          </div>

          <ReservationPanel listing={l} reservations={reservations} me={me} buyerNames={buyerNames} d={d} locale={locale} />
          <ButtonLink href={`/hubs?crop=${l.cropKey}`} variant="secondary">
            <Warehouse className="size-4" aria-hidden />
            {t.findStorage}
          </ButtonLink>
          <ButtonLink href={`/recovery?listing=${l.id}`} variant="ghost">{d.recovery.openFrom}</ButtonLink>
        </div>

        <div className="space-y-6">
          <Card>
            <dl className="grid grid-cols-3 gap-4 text-center">
              <div>
                <dt className="text-xs font-semibold text-charcoal/70">{t.total}</dt>
                <dd className="mt-1 text-xl font-extrabold">{kg(l.totalKg)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-charcoal/70">{t.reserved}</dt>
                <dd className="mt-1 text-xl font-extrabold">{kg(l.reservedKg)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-charcoal/70">{t.availableNow}</dt>
                <dd className="mt-1 text-xl font-extrabold text-forest">{kg(l.availableKg)}</dd>
              </div>
            </dl>
            <div className="mt-5">
              <QuantityBar totalKg={l.totalKg} reservations={reservations} label={`${t.reserved}: ${kg(l.reservedKg)}, ${t.availableNow}: ${kg(l.availableKg)}`} />
            </div>
            <h3 className="mt-5 text-sm font-bold text-forest">{t.reservations}</h3>
            {reservations.length === 0 ? (
              <p className="mt-1 text-sm text-charcoal/70">{t.noReservations}</p>
            ) : (
              <ul className="mt-1 divide-y divide-charcoal/10 text-sm">
                {reservations.map((r) => (
                  <li key={r.id} className="flex justify-between py-2">
                    <span className="font-semibold">{kg(r.quantityKg)}{r.buyerId === me?.id ? ` · ${d.reserve.you}` : ""}</span>
                    <span className="text-charcoal/75">{t.reservationStatus[r.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-forest">{t.condition}</h2>
            <p className="mt-2">
              <Badge tone={l.reportedCondition === "poor" ? "caution" : "ok"}>{m.conditions[l.reportedCondition]}</Badge>{" "}
              <span className="text-sm text-charcoal/75">{relativeTime(l.conditionReportedAt, locale)}</span>
            </p>
            {l.conditionNotes ? <p className="mt-2 text-sm">{l.conditionNotes}</p> : null}
            <p className="mt-3 flex gap-2 text-sm text-charcoal/70">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t.conditionNote}
            </p>
          </Card>

          <Card>
            <dl className="divide-y divide-charcoal/10">
              {facts.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-sm font-semibold text-charcoal/70">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-forest">{t.handling}</h2>
            <p className="mt-2 text-sm">{crop.handlingNotes}</p>
            <p className="mt-3 text-sm text-charcoal/70">{t.handlingNote}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
