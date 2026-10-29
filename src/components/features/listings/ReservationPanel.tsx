import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authMode } from "@/lib/session";
import { Badge } from "@/components/ui/Badge";
import type { Reservation, User } from "@/lib/domain/types";
import type { Dict, Locale } from "@/lib/i18n/config";
import type { ListingView } from "@/lib/repositories/interfaces";
import { formatNumber } from "@/lib/utils/format";
import { ReservationActions, type ActionChoice } from "./ReservationActions";
import { ReserveForm } from "./ReserveForm";

const SELLER_CHOICES = (t: Dict["reserve"], s: Reservation["status"]): ActionChoice[] =>
  s === "requested"
    ? [{ to: "confirmed", label: t.confirm, variant: "primary" }, { to: "declined", label: t.decline, variant: "ghost" }]
    : s === "confirmed"
      ? [{ to: "collected", label: t.collected, variant: "primary" }]
      : [];

/** What the current demo user can do on this listing: reserve, manage reservations, or just read. */
export function ReservationPanel({ listing, reservations, me, buyerNames, d, locale }: {
  listing: ListingView; reservations: Reservation[]; me: User | null; buyerNames: Record<string, string>; d: Dict; locale: Locale;
}) {
  const t = d.reserve;
  const status = d.market.detail.reservationStatus;
  const kg = (n: number) => `${formatNumber(n, locale)} ${d.common.kg}`;
  const isSeller = !!me && me.id === listing.sellerId;
  const mine = me ? reservations.filter((r) => r.buyerId === me.id) : [];
  const mineActive = mine.filter((r) => r.status === "requested" || r.status === "confirmed");
  const canReserve = me?.role === "buyer" && listing.status === "active" && listing.availableKg > 0 && mineActive.length === 0;

  return (
    <Card className="space-y-5">
      <h2 className="text-lg font-bold text-forest">{isSeller ? t.sellerTitle : t.title}</h2>

      {isSeller ? (
        reservations.length === 0 ? (
          <p className="text-sm text-charcoal/70">{d.market.detail.noReservations}</p>
        ) : (
          <ul className="divide-y divide-charcoal/10">
            {reservations.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{buyerNames[r.buyerId] ?? "—"} · {kg(r.quantityKg)}</span>
                  <Badge tone={r.status === "confirmed" || r.status === "collected" ? "ok" : "neutral"}>{status[r.status]}</Badge>
                </div>
                <ReservationActions reservationId={r.id} listingId={listing.id} choices={SELLER_CHOICES(t, r.status)} errors={t.errors} />
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          {canReserve ? (
            <ReserveForm listingId={listing.id} availableKg={listing.availableKg} t={t} locale={locale} />
          ) : !me ? (
            <div className="space-y-3"><p className="text-sm text-charcoal/75">{d.auth.signInToAct}</p><ButtonLink href="/login">{d.auth.login}</ButtonLink></div>
          ) : me.role !== "buyer" ? (
            <p className="text-sm text-charcoal/75">{authMode() === "demo" ? t.viewAsBuyer : t.errors.notBuyer}</p>
          ) : listing.status !== "active" || listing.availableKg <= 0 ? (
            <p className="text-sm text-charcoal/75">{listing.status !== "active" ? t.closed : t.errors.soldOut}</p>
          ) : null}

          {mine.length ? (
            <div>
              <h3 className="text-sm font-bold text-forest">{t.yours}</h3>
              <ul className="mt-1 divide-y divide-charcoal/10">
                {mine.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{kg(r.quantityKg)}</span>
                      <Badge tone={r.status === "confirmed" || r.status === "collected" ? "ok" : "neutral"}>{status[r.status]}</Badge>
                    </div>
                    {r.status === "requested" || r.status === "confirmed" ? (
                      <ReservationActions reservationId={r.id} listingId={listing.id} choices={[{ to: "cancelled", label: t.cancel, variant: "ghost" }]} errors={t.errors} />
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}
