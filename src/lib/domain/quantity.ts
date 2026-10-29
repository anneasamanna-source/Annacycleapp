import { KG_PER_UNIT, QUANTITY_HOLDING_RESERVATION, type Availability, type Unit } from "./enums";
import type { Listing, Reservation } from "./types";

/** Avoids 0.1 + 0.2 style errors in kg sums. */
const round = (n: number) => Math.round(n * 100) / 100;

export const toKg = (quantity: number, unit: Unit) => round(quantity * KG_PER_UNIT[unit]);
export const fromKg = (kg: number, unit: Unit) => round(kg / KG_PER_UNIT[unit]);

export function reservedKg(reservations: Reservation[]): number {
  return round(
    reservations
      .filter((r) => QUANTITY_HOLDING_RESERVATION.includes(r.status))
      .reduce((sum, r) => sum + r.quantityKg, 0),
  );
}

export function availableKg(listing: Pick<Listing, "totalKg">, reservations: Reservation[]): number {
  return Math.max(0, round(listing.totalKg - reservedKg(reservations)));
}

export function availabilityOf(totalKg: number, reserved: number): Availability {
  if (reserved <= 0) return "available";
  return reserved >= totalKg ? "fully_reserved" : "partly_reserved";
}
