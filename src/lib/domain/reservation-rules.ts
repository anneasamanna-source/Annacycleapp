import { QUANTITY_HOLDING_RESERVATION, type ReservationStatus } from "./enums";
import { availableKg } from "./quantity";
import type { Listing, Reservation, User } from "./types";

/**
 * The reservation rules, as pure functions. No database, no clock, no UI.
 * The repository runs these inside its atomic step, so the same rules protect
 * both the demo data and (in Stage 10) the real database.
 */
export type ReserveError =
  | "notBuyer" | "ownListing" | "listingClosed" | "windowEnded"
  | "qtyInvalid" | "qtyTooMuch" | "soldOut" | "duplicate";

export type ReserveCheck =
  | { ok: true; quantityKg: number }
  | { ok: false; error: ReserveError; availableKg: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function checkReservation(args: {
  listing: Listing;
  reservations: Reservation[]; // all reservations on this listing
  buyer: Pick<User, "id" | "role">;
  requestedKg: number;
  now: Date;
}): ReserveCheck {
  const { listing, reservations, buyer, now } = args;
  const available = availableKg(listing, reservations);
  const fail = (error: ReserveError): ReserveCheck => ({ ok: false, error, availableKg: available });

  if (buyer.role !== "buyer") return fail("notBuyer");
  if (buyer.id === listing.sellerId) return fail("ownListing");
  if (listing.status !== "active") return fail("listingClosed");
  if (new Date(listing.collectionUntil) <= now) return fail("windowEnded");

  const requested = round2(args.requestedKg);
  if (!Number.isFinite(requested) || requested <= 0) return fail("qtyInvalid");
  if (reservations.some((r) => r.buyerId === buyer.id && QUANTITY_HOLDING_RESERVATION.includes(r.status))) {
    return fail("duplicate");
  }
  if (available <= 0) return fail("soldOut");
  if (requested > available) return fail("qtyTooMuch");
  return { ok: true, quantityKg: requested };
}

/** Who may move a reservation to which status. The status machine says what is possible; this says who. */
export function canActOnReservation(
  actor: Pick<User, "id">,
  listing: Pick<Listing, "sellerId">,
  reservation: Pick<Reservation, "buyerId">,
  to: ReservationStatus,
): boolean {
  if (actor.id === listing.sellerId) return to === "confirmed" || to === "declined" || to === "collected";
  if (actor.id === reservation.buyerId) return to === "cancelled";
  return false;
}
