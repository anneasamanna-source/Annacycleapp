import { describe, expect, it } from "vitest";
import { BOOKING_STATUSES, LISTING_STATUSES, RESERVATION_STATUSES } from "@/lib/domain/enums";
import { BOOKING_TRANSITIONS, LISTING_TRANSITIONS, RESERVATION_TRANSITIONS, assertTransition, canTransition } from "@/lib/domain/status-machine";

describe("status machines", () => {
  it("define every status", () => {
    expect(Object.keys(LISTING_TRANSITIONS).sort()).toEqual([...LISTING_STATUSES].sort());
    expect(Object.keys(RESERVATION_TRANSITIONS).sort()).toEqual([...RESERVATION_STATUSES].sort());
    expect(Object.keys(BOOKING_TRANSITIONS).sort()).toEqual([...BOOKING_STATUSES].sort());
  });
  it("only point to statuses that exist", () => {
    for (const [m, all] of [[LISTING_TRANSITIONS, LISTING_STATUSES], [RESERVATION_TRANSITIONS, RESERVATION_STATUSES], [BOOKING_TRANSITIONS, BOOKING_STATUSES]] as const)
      for (const next of Object.values(m).flat()) expect((all as readonly string[]).includes(next)).toBe(true);
  });
  it("end states have no way out", () => {
    for (const s of ["collected", "cancelled", "declined", "expired"] as const) expect(RESERVATION_TRANSITIONS[s]).toEqual([]);
    expect(BOOKING_TRANSITIONS.released).toEqual([]);
  });
  it("allow the normal path and refuse shortcuts", () => {
    expect(canTransition(RESERVATION_TRANSITIONS, "requested", "confirmed")).toBe(true);
    expect(canTransition(RESERVATION_TRANSITIONS, "requested", "collected")).toBe(false);
    expect(canTransition(BOOKING_TRANSITIONS, "requested", "released")).toBe(false);
    expect(() => assertTransition(RESERVATION_TRANSITIONS, "collected", "confirmed")).toThrow();
  });
});
