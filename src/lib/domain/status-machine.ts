import type { BookingStatus, ListingStatus, ReservationStatus } from "./enums";

/** Allowed next statuses. Anything not listed is not allowed. */
type Machine<S extends string> = Record<S, readonly S[]>;

export const LISTING_TRANSITIONS: Machine<ListingStatus> = {
  active: ["collected", "expired", "withdrawn", "redirected"],
  collected: [],
  expired: [],
  withdrawn: [],
  redirected: [],
};

export const RESERVATION_TRANSITIONS: Machine<ReservationStatus> = {
  requested: ["confirmed", "cancelled", "declined", "expired"],
  confirmed: ["collected", "cancelled", "expired"],
  collected: [],
  cancelled: [],
  declined: [],
  expired: [],
};

export const BOOKING_TRANSITIONS: Machine<BookingStatus> = {
  requested: ["accepted", "declined", "cancelled"],
  accepted: ["checked_in", "cancelled"],
  checked_in: ["released"],
  released: [],
  declined: [],
  cancelled: [],
};

export function canTransition<S extends string>(machine: Machine<S>, from: S, to: S): boolean {
  return machine[from].includes(to);
}

export function nextStatuses<S extends string>(machine: Machine<S>, from: S): readonly S[] {
  return machine[from];
}

export function assertTransition<S extends string>(machine: Machine<S>, from: S, to: S): void {
  if (!canTransition(machine, from, to)) {
    throw new Error(`Status cannot change from "${from}" to "${to}".`);
  }
}
