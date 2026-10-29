import { beforeEach, describe, expect, it } from "vitest";
import { demoRepositories as repo, resetDemoStore } from "@/lib/repositories/demo";

beforeEach(resetDemoStore);

describe("demo repository: reserve", () => {
  it("sample tomato listing starts at 75 kg reserved, 25 kg available", async () => {
    const l = await repo.listings.getById("l-1");
    expect([l?.reservedKg, l?.availableKg, l?.availability]).toEqual([75, 25, "partly_reserved"]);
  });

  it("takes the last 25 kg, then refuses anyone else", async () => {
    const ok = await repo.reservations.reserve({ listingId: "l-1", buyerId: "u-b3", quantityKg: 25 });
    expect(ok).toMatchObject({ ok: true, availableKg: 0 });
    expect((await repo.listings.getById("l-1"))?.availability).toBe("fully_reserved");
    const late = await repo.reservations.reserve({ listingId: "l-1", buyerId: "u-b1", quantityKg: 1 });
    expect(late).toMatchObject({ ok: false });
  });

  it("never oversells when buyers ask at the same instant", async () => {
    // Spinach l-6 has 20 kg. Three different buyers each ask for 15 kg at once: exactly one can win.
    const results = await Promise.all(
      ["u-b1", "u-b2", "u-b3"].map((buyerId) => repo.reservations.reserve({ listingId: "l-6", buyerId, quantityKg: 15 })),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const l = await repo.listings.getById("l-6");
    expect([l?.reservedKg, l?.availableKg]).toEqual([15, 5]);
  });

  it("same-buyer double click only reserves once", async () => {
    const [x, y] = await Promise.all([
      repo.reservations.reserve({ listingId: "l-8", buyerId: "u-b3", quantityKg: 100 }),
      repo.reservations.reserve({ listingId: "l-8", buyerId: "u-b3", quantityKg: 100 }),
    ]);
    expect([x.ok, y.ok].filter(Boolean)).toHaveLength(1);
    expect((await repo.listings.getById("l-8"))?.reservedKg).toBe(100);
  });
});

describe("demo repository: status changes", () => {
  it("cancelling frees the kilograms", async () => {
    const r = await repo.reservations.transition({ reservationId: "r-2", to: "cancelled", actorId: "u-b2" });
    expect(r.ok).toBe(true);
    expect((await repo.listings.getById("l-1"))?.availableKg).toBe(60);
  });
  it("only the right person can act", async () => {
    expect(await repo.reservations.transition({ reservationId: "r-2", to: "cancelled", actorId: "u-b1" })).toEqual({ ok: false, error: "forbidden" });
    expect(await repo.reservations.transition({ reservationId: "r-2", to: "confirmed", actorId: "u-b2" })).toEqual({ ok: false, error: "forbidden" });
    expect(await repo.reservations.transition({ reservationId: "r-2", to: "confirmed", actorId: "u-v1" })).toMatchObject({ ok: true });
  });
  it("blocks impossible jumps", async () => {
    expect(await repo.reservations.transition({ reservationId: "r-2", to: "collected", actorId: "u-v1" })).toEqual({ ok: false, error: "badTransition" });
    expect(await repo.reservations.transition({ reservationId: "nope", to: "confirmed", actorId: "u-v1" })).toEqual({ ok: false, error: "notFound" });
  });
  it("marks the listing collected once all kilograms are collected", async () => {
    // l-5: bitter gourd 30 kg, fully reserved by r-4 (confirmed)
    await repo.reservations.transition({ reservationId: "r-4", to: "collected", actorId: "u-v3" });
    expect((await repo.listings.getById("l-5"))?.status).toBe("collected");
  });
});
