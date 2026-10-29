import type { DataBasis } from "../domain/enums";
import type { HubBooking, Listing, Reservation } from "../domain/types";
import type { ImpactFigure } from "../domain/types";

const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;

/**
 * Impact is counted in separate steps, and listed produce is NEVER counted as saved food.
 * Basis rules:
 *  - demo mode: every figure is "demo" (sample data), except value, which is always an "estimate".
 *  - live mode: collected and verified kilograms are "verified" (backed by a record); the earlier
 *    steps are "estimated" until outcomes are confirmed. Estimated value uses ASKING prices, not what was paid.
 */
export function computeImpact(
  data: { listings: Listing[]; reservations: Reservation[]; bookings: HubBooking[] },
  mode: "demo" | "live" = "demo",
): ImpactFigure[] {
  const { listings, reservations, bookings } = data;
  const byId = new Map(listings.map((l) => [l.id, l]));
  const kgOf = (statuses: Reservation["status"][]) =>
    sum(reservations.filter((x) => statuses.includes(x.status)).map((x) => x.quantityKg));

  const collected = kgOf(["collected"]);
  const redirected = sum([
    ...listings.filter((l) => l.status === "redirected").map((l) => l.totalKg),
    ...bookings.filter((b) => b.status === "checked_in" || b.status === "released").map((b) => b.quantityKg),
  ]);
  const value = Math.round(
    reservations.filter((x) => x.status === "collected").reduce((t, x) => t + x.quantityKg * (byId.get(x.listingId)?.askingPricePerKg ?? 0), 0),
  );
  const basis = (verified: boolean): DataBasis => (mode === "demo" ? "demo" : verified ? "verified" : "estimated");

  return [
    { metric: "listed", value: sum(listings.filter((l) => l.status !== "withdrawn").map((l) => l.totalKg)), unit: "kg", basis: basis(false) },
    { metric: "matched", value: kgOf(["requested", "confirmed", "collected"]), unit: "kg", basis: basis(false) },
    { metric: "sold", value: kgOf(["confirmed", "collected"]), unit: "kg", basis: basis(false) },
    { metric: "collected", value: collected, unit: "kg", basis: basis(true) },
    { metric: "redirected", value: redirected, unit: "kg", basis: basis(false) },
    { metric: "verified_recovered", value: collected, unit: "kg", basis: basis(true) },
    { metric: "estimated_value", value, unit: "INR", basis: "estimated" },
  ];
}
