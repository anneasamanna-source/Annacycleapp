import type { Metadata } from "next";
import Link from "next/link";
import { BookingControls } from "@/components/features/batches/BookingControls";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getCropProfile } from "@/lib/domain/crop-profiles";
import type { HubBooking } from "@/lib/domain/types";
import { authMode, requireViewer } from "@/lib/session";
import { getDict, getLocale } from "@/lib/i18n";
import { getRepositories } from "@/lib/repositories";
import { formatDateTime, formatNumber, relativeTime } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).batches.title };
}

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ booked?: string }> }) {
  const [d, locale, me, sp] = await Promise.all([getDict(), getLocale(), requireViewer(), searchParams]);
  const repos = getRepositories();
  const t = d.batches;
  const kg = (n: number) => `${formatNumber(n, locale)} ${d.common.kg}`;
  const nm = (k: Parameters<typeof getCropProfile>[0], fallback: string) => (locale === "bn" ? getCropProfile(k).nameBn : fallback);

  const listings = await repos.listings.list({ sort: "deadline" });
  const hubs = await repos.hubs.list();
  const hubName = (id: string) => hubs.find((h) => h.id === id)?.name ?? id;
  const allBookings = await repos.hubs.listAllBookings();
  const isOp = me.role === "hub_operator";
  const myHubs = hubs.filter((h) => h.operatorId === me.id);

  const BookingRow = ({ b, ctl }: { b: HubBooking; ctl?: "operator" | "vendor" }) => (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{b.batchCode} · {nm(b.cropKey, getCropProfile(b.cropKey).nameEn)} · {kg(b.quantityKg)}</span>
        <Badge tone={b.status === "accepted" || b.status === "checked_in" ? "ok" : "neutral"}>{d.bookingStatus[b.status]}</Badge>
      </div>
      <p className="text-sm text-charcoal/75">{hubName(b.hubId)} · {t.expected}: {formatDateTime(b.expectedReleaseAt, locale)} ({relativeTime(b.expectedReleaseAt, locale)})</p>
      {b.checks.length ? (
        <ul className="mt-1 text-sm text-charcoal/75">
          {b.checks.map((c, i) => <li key={i}>{t.inspections}: {d.market.conditions[c.condition]}{c.notes ? ` · ${c.notes}` : ""} · {formatDateTime(c.at, locale)}</li>)}
        </ul>
      ) : null}
      {ctl ? <BookingControls bookingId={b.id} status={b.status} role={ctl} d={d} /> : null}
    </li>
  );
  const List = ({ title, children, empty }: { title: string; children: React.ReactNode; empty: boolean }) => (
    <Card><h2 className="text-lg font-bold text-forest">{title}</h2>
      {empty ? <p className="mt-2 text-sm text-charcoal/70">{t.empty}</p> : <ul className="mt-2 divide-y divide-charcoal/10">{children}</ul>}
    </Card>
  );
  const ListingRow = ({ l }: { l: (typeof listings)[number] }) => (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/marketplace/${l.id}`} className="font-semibold text-forest hover:underline">{l.batchCode} · {nm(l.cropKey, l.produceName)}</Link>
        <Badge tone={l.status === "active" ? "ok" : "neutral"}>{d.market.detail.listingStatus[l.status]}</Badge>
      </div>
      <p className="text-sm text-charcoal/75">{t.total} {kg(l.totalKg)} · {t.reserved} {kg(l.reservedKg)} · {t.available} {kg(l.availableKg)}</p>
    </li>
  );

  const mineL = listings.filter((l) => l.sellerId === me.id);
  const myRes = (await Promise.all(listings.map(async (l) => (await repos.reservations.listForListing(l.id)).filter((r) => r.buyerId === me.id).map((r) => ({ r, l })))) ).flat();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{t.title}</h1>
      {sp.booked ? <p role="status" className="rounded-xl bg-forest/10 p-3 font-semibold text-forest">{d.hubs.success}</p> : null}

      {me.role === "vendor" ? (<>
        <List title={t.yourBatches} empty={mineL.length === 0}>{mineL.map((l) => <ListingRow key={l.id} l={l} />)}</List>
        <List title={t.yourBookings} empty={!allBookings.some((b) => b.vendorId === me.id)}>
          {allBookings.filter((b) => b.vendorId === me.id).map((b) => <BookingRow key={b.id} b={b} ctl="vendor" />)}
        </List>
      </>) : null}

      {me.role === "buyer" ? (
        <List title={t.yourReservations} empty={myRes.length === 0}>
          {myRes.map(({ r, l }) => (
            <li key={r.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/marketplace/${l.id}`} className="font-semibold text-forest hover:underline">{l.batchCode} · {nm(l.cropKey, l.produceName)} · {kg(r.quantityKg)}</Link>
                <Badge tone={r.status === "confirmed" || r.status === "collected" ? "ok" : "neutral"}>{d.market.detail.reservationStatus[r.status]}</Badge>
              </div>
            </li>
          ))}
        </List>
      ) : null}

      {isOp ? (
        myHubs.length === 0 ? <Card><p className="text-sm text-charcoal/75">{d.dashboard.noHubs}</p></Card> : myHubs.map((h) => (
          <Card key={h.id}>
            <h2 className="text-lg font-bold text-forest">{h.name}</h2>
            <p className="text-sm text-charcoal/75">{t.capacity} {kg(h.capacityKg)} · {t.free} {kg(h.availableKg)}</p>
            <h3 className="mt-3 text-sm font-bold text-forest">{t.hubBookings}</h3>
            {allBookings.some((b) => b.hubId === h.id) ? (
              <ul className="divide-y divide-charcoal/10">{allBookings.filter((b) => b.hubId === h.id).map((b) => <BookingRow key={b.id} b={b} ctl="operator" />)}</ul>
            ) : <p className="mt-1 text-sm text-charcoal/70">{t.empty}</p>}
          </Card>
        ))
      ) : null}

      {me.role === "admin" ? (<>
        <List title={t.allListings} empty={listings.length === 0}>{listings.map((l) => <ListingRow key={l.id} l={l} />)}</List>
        <List title={t.allBookings} empty={allBookings.length === 0}>{allBookings.map((b) => <BookingRow key={b.id} b={b} ctl="operator" />)}</List>
      </>) : null}
    </div>
  );
}
