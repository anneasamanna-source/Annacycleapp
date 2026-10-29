import { describe, expect, it } from "vitest";
import { canActOnReservation, checkReservation } from "@/lib/domain/reservation-rules";
import type { Listing, Reservation } from "@/lib/domain/types";

const NOW = new Date("2026-10-25T12:00:00Z");
const listing: Listing = {
  id: "l", batchCode: "AC-1", sellerId: "seller", cropKey: "tomato", produceName: "Tomatoes", category: "fruiting",
  totalKg: 100, displayUnit: "kg", askingPricePerKg: 24, place: { district: "Hooghly", area: "x" },
  reportedCondition: "good", conditionReportedAt: NOW.toISOString(), collectionFrom: NOW.toISOString(),
  collectionUntil: "2026-10-26T12:00:00Z", recoverBy: "2026-10-27T12:00:00Z", status: "active",
  createdAt: NOW.toISOString(), isDemo: true,
};
const res = (buyerId: string, quantityKg: number, status: Reservation["status"] = "confirmed"): Reservation => ({
  id: `${buyerId}-${quantityKg}`, listingId: "l", buyerId, quantityKg, status, createdAt: NOW.toISOString(),
});
const buyer = (id: string) => ({ id, role: "buyer" as const });
const check = (reservations: Reservation[], who: string, kg: number, over: Partial<Listing> = {}) =>
  checkReservation({ listing: { ...listing, ...over }, reservations, buyer: buyer(who), requestedKg: kg, now: NOW });

describe("split-batch example: 100 kg of tomatoes", () => {
  const a = res("A", 40);
  const b = res("B", 35, "requested");

  it("lets buyer C reserve exactly the remaining 25 kg", () => {
    expect(check([a, b], "C", 25)).toEqual({ ok: true, quantityKg: 25 });
  });
  it("refuses 26 kg and reports 25 kg available", () => {
    expect(check([a, b], "C", 26)).toEqual({ ok: false, error: "qtyTooMuch", availableKg: 25 });
  });
  it("says sold out once everything is reserved", () => {
    expect(check([a, b, res("C", 25)], "D", 1)).toMatchObject({ ok: false, error: "soldOut", availableKg: 0 });
  });
  it("frees quantity when a reservation is cancelled, declined or expired", () => {
    for (const status of ["cancelled", "declined", "expired"] as const) {
      expect(check([a, res("B", 35, status)], "C", 60)).toEqual({ ok: true, quantityKg: 60 });
    }
  });
  it("keeps quantity held for collected reservations", () => {
    expect(check([res("A", 40, "collected")], "C", 61)).toMatchObject({ ok: false, error: "qtyTooMuch", availableKg: 60 });
  });
});

describe("other rules", () => {
  it("rejects zero, negative and non-numeric quantities", () => {
    for (const kg of [0, -5, NaN, Infinity]) expect(check([], "C", kg)).toMatchObject({ ok: false, error: "qtyInvalid" });
  });
  it("rounds to two decimals so kilograms never drift", () => {
    expect(check([], "C", 10.456)).toEqual({ ok: true, quantityKg: 10.46 });
  });
  it("does not let 0.1 + 0.2 style rounding oversell", () => {
    expect(check([res("A", 99.9)], "C", 0.1)).toEqual({ ok: true, quantityKg: 0.1 });
    expect(check([res("A", 99.9)], "C", 0.11)).toMatchObject({ ok: false, error: "qtyTooMuch" });
  });
  it("blocks sellers, non-buyers, duplicates, closed listings and ended windows", () => {
    expect(check([], "seller", 5)).toMatchObject({ error: "ownListing" });
    expect(checkReservation({ listing, reservations: [], buyer: { id: "v", role: "vendor" }, requestedKg: 5, now: NOW })).toMatchObject({ error: "notBuyer" });
    expect(check([res("C", 5)], "C", 5)).toMatchObject({ error: "duplicate" });
    expect(check([], "C", 5, { status: "withdrawn" })).toMatchObject({ error: "listingClosed" });
    expect(check([], "C", 5, { collectionUntil: "2026-10-25T11:00:00Z" })).toMatchObject({ error: "windowEnded" });
  });
  it("allows a buyer to re-reserve after cancelling", () => {
    expect(check([res("C", 5, "cancelled")], "C", 5)).toEqual({ ok: true, quantityKg: 5 });
  });
});

describe("who may change a reservation", () => {
  const r = { buyerId: "B" };
  it("seller confirms, declines and marks collected, but cannot cancel for the buyer", () => {
    for (const to of ["confirmed", "declined", "collected"] as const) expect(canActOnReservation({ id: "seller" }, listing, r, to)).toBe(true);
    expect(canActOnReservation({ id: "seller" }, listing, r, "cancelled")).toBe(false);
  });
  it("buyer may only cancel their own", () => {
    expect(canActOnReservation({ id: "B" }, listing, r, "cancelled")).toBe(true);
    expect(canActOnReservation({ id: "B" }, listing, r, "confirmed")).toBe(false);
    expect(canActOnReservation({ id: "other" }, listing, r, "cancelled")).toBe(false);
  });
});
