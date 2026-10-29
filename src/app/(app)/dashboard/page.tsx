import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCropProfile } from "@/lib/domain/crop-profiles";
import { authMode, requireViewer } from "@/lib/session";
import { getDict, getLocale } from "@/lib/i18n";
import { getRepositories } from "@/lib/repositories";
import { fill, formatNumber } from "@/lib/utils/format";
import { withdrawListingAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).dashboard.title };
}

export default async function DashboardPage() {
  const [d, locale, me] = await Promise.all([getDict(), getLocale(), requireViewer()]);
  const repos = getRepositories();
  const t = d.dashboard;
  const n = (x: number) => formatNumber(x, locale);
  const listings = await repos.listings.list();
  const hubs = await repos.hubs.list();
  const bookings = await repos.hubs.listAllBookings();
  const reservations = (await Promise.all(listings.map((l) => repos.reservations.listForListing(l.id)))).flat();

  let stats: [string, string][] = [];
  let links: [string, string][] = [];
  if (me.role === "vendor") {
    const mine = listings.filter((l) => l.sellerId === me.id && l.status === "active");
    const ids = new Set(listings.filter((l) => l.sellerId === me.id).map((l) => l.id));
    stats = [[t.activeListings, n(mine.length)], [t.kgListed, n(mine.reduce((s, l) => s + l.totalKg, 0))], [t.kgReserved, n(mine.reduce((s, l) => s + l.reservedKg, 0))],
      [t.pendingRequests, n(reservations.filter((r) => ids.has(r.listingId) && r.status === "requested").length)]];
    links = [["/surplus/new", d.nav.surplusNew], ["/batches", d.nav.batches], ["/recovery", d.nav.recovery], ["/hubs", d.nav.hubs]];
  } else if (me.role === "buyer") {
    const mine = reservations.filter((r) => r.buyerId === me.id && (r.status === "requested" || r.status === "confirmed"));
    stats = [[t.myReservations, n(mine.length)], [t.kgReserved, n(mine.reduce((s, r) => s + r.quantityKg, 0))]];
    links = [["/marketplace", d.nav.marketplace], ["/batches", d.nav.batches]];
  } else if (me.role === "hub_operator") {
    const mine = hubs.filter((h) => h.operatorId === me.id);
    stats = [[t.hubsRun, n(mine.length)], [t.freeCapacity, n(mine.reduce((s, h) => s + h.availableKg, 0))],
      [t.pendingBookings, n(bookings.filter((b) => mine.some((h) => h.id === b.hubId) && b.status === "requested").length)]];
    links = [["/batches", d.nav.batches], ["/hubs", d.nav.hubs]];
  } else {
    stats = [[t.listings, n(listings.length)], [t.hubsCount, n(hubs.length)], [t.users, n((await repos.users.listAll()).length)]];
    links = [["/impact", d.nav.impact], ["/batches", d.nav.batches], ["/hubs", d.nav.hubs]];
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{t.title}</h1>
      <p className="mt-1 text-charcoal/75">{fill(t.hello, { name: me.name })} · {d.demoView.roles[me.role]}</p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {stats.map(([k, v]) => (
          <Card key={k}><dt className="text-sm font-semibold text-charcoal/70">{k}</dt><dd className="mt-1 text-3xl font-extrabold text-forest">{v}</dd></Card>
        ))}
      </dl>
      <h2 className="mt-8 text-sm font-bold text-forest">{t.goTo}</h2>
      <div className="mt-2 flex flex-wrap gap-3">{links.map(([href, label]) => <ButtonLink key={href} href={href} variant="secondary">{label}</ButtonLink>)}</div>

      {me.role === "admin" ? (
        <Card className="mt-8">
          <h2 className="text-lg font-bold text-forest">{t.moderation}</h2>
          <ul className="mt-2 divide-y divide-charcoal/10">
            {listings.filter((l) => l.status === "active").map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-semibold">{l.batchCode} · {locale === "bn" ? getCropProfile(l.cropKey).nameBn : l.produceName} <span className="font-normal text-charcoal/70">· {l.seller.name}</span></span>
                <form action={withdrawListingAction}><input type="hidden" name="listingId" value={l.id} /><Button type="submit" variant="ghost">{t.withdraw}</Button></form>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
