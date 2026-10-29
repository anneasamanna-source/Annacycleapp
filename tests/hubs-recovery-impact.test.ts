import { beforeEach, describe, expect, it } from "vitest";
import { checkBooking, maxDaysFor, storageFit } from "@/lib/domain/booking-rules";
import { demoRepositories as repo, resetDemoStore } from "@/lib/repositories/demo";
import { computeImpact } from "@/lib/services/impact";
import { recommend } from "@/lib/services/recovery-engine";

beforeEach(resetDemoStore);
const now = () => new Date();
const hubOf = async (id: string) => (await repo.hubs.getById(id))!;

describe("hub storage rules", () => {
  it("never allows more than 3 days, the hub's limit, or the crop's limit", async () => {
    expect(maxDaysFor(await hubOf("h-3"), "pumpkin")).toBe(3);
    expect(maxDaysFor(await hubOf("h-1"), "pumpkin")).toBe(2); // hub max 2
    expect(maxDaysFor(await hubOf("h-3"), "leafy_greens")).toBe(1); // crop max 1
    expect(maxDaysFor(await hubOf("h-3"), "tomato")).toBe(2); // crop max 2
  });
  it("keeps refrigeration-sensitive crops out of cold-only hubs", async () => {
    expect(storageFit(await hubOf("h-4"), "tomato")).not.toBe("ok"); // cool + cold only
    expect(storageFit(await hubOf("h-1"), "tomato")).toBe("ok");
    expect(storageFit(await hubOf("h-4"), "carrot")).toBe("ok");
  });
  it("filters hubs by crop on the list", async () => {
    expect((await repo.hubs.list({ cropKey: "tomato" })).map((h) => h.id)).not.toContain("h-4");
  });
  it("rejects bad requests with a clear reason", async () => {
    const base = { hubId: "h-1", vendorId: "u-v1", batchCode: "AC-1001", quantityKg: 50, days: 1 };
    expect(await repo.hubs.requestBooking({ ...base, days: 3 })).toMatchObject({ ok: false, error: "daysTooLong", limit: 2 });
    expect(await repo.hubs.requestBooking({ ...base, quantityKg: 500 })).toMatchObject({ ok: false, error: "qtyTooMuch" });
    expect(await repo.hubs.requestBooking({ ...base, hubId: "h-4" })).toMatchObject({ ok: false });
    expect(await repo.hubs.requestBooking({ ...base, vendorId: "u-v2" })).toMatchObject({ ok: false, error: "notYourBatch" });
    expect(await repo.hubs.requestBooking({ ...base, vendorId: "u-b1" })).toMatchObject({ ok: false });
    expect(await repo.hubs.requestBooking({ ...base, quantityKg: 0 })).toMatchObject({ ok: false, error: "qtyInvalid" });
  });
  it("never overbooks capacity, even for simultaneous requests", async () => {
    // h-1 has 310 kg free. Potatoes batch is 300 kg owned by u-v3 and h-1 accepts roots: two requests of 200 kg.
    const [a, b] = await Promise.all([
      repo.hubs.requestBooking({ hubId: "h-1", vendorId: "u-v3", batchCode: "AC-1008", quantityKg: 200, days: 1 }),
      repo.hubs.requestBooking({ hubId: "h-1", vendorId: "u-v3", batchCode: "AC-1008", quantityKg: 200, days: 1 }),
    ]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    expect((await hubOf("h-1")).availableKg).toBe(110);
  });
  it("lets only the right person move a booking, and requires an inspection to check in", async () => {
    expect(await repo.hubs.transitionBooking({ bookingId: "b-2", to: "accepted", actorId: "u-v1" })).toMatchObject({ ok: false, error: "forbidden" });
    expect(await repo.hubs.transitionBooking({ bookingId: "b-2", to: "accepted", actorId: "u-o1" })).toMatchObject({ ok: true });
    expect(await repo.hubs.transitionBooking({ bookingId: "b-2", to: "checked_in", actorId: "u-o1" })).toMatchObject({ ok: false, error: "checkRequired" });
    expect(await repo.hubs.transitionBooking({ bookingId: "b-2", to: "checked_in", actorId: "u-o1", check: { condition: "good" } })).toMatchObject({ ok: true });
    expect(await repo.hubs.addCheck({ bookingId: "b-2", actorId: "u-o1", condition: "fair", notes: "a few soft" })).toMatchObject({ ok: true });
    expect((await repo.hubs.listBookings("h-1")).find((b) => b.id === "b-2")?.checks).toHaveLength(2);
    expect(await repo.hubs.transitionBooking({ bookingId: "b-2", to: "released", actorId: "u-o1" })).toMatchObject({ ok: true });
    expect(await repo.hubs.transitionBooking({ bookingId: "b-2", to: "accepted", actorId: "u-o1" })).toMatchObject({ ok: false, error: "badTransition" });
  });
  it("lets a vendor cancel their own request", async () => {
    expect(await repo.hubs.transitionBooking({ bookingId: "b-2", to: "cancelled", actorId: "u-v1" })).toMatchObject({ ok: true });
  });
  it("checkBooking is pure and gives a limit to show", async () => {
    expect(checkBooking({ hub: await hubOf("h-3"), freeKg: 10, cropKey: "carrot", quantityKg: 20, days: 1, batchKg: 60, user: { role: "vendor" } })).toEqual({ ok: false, error: "noCapacity", limit: 10 });
  });
});

describe("Food Recovery Engine", () => {
  const run = async (id: string, patch?: Record<string, unknown>) => {
    const listing = { ...(await repo.listings.getById(id))!, ...patch } as never;
    return recommend({ listing, reservations: await repo.reservations.listForListing(id), hubs: await repo.hubs.list(), now: now() });
  };
  const eligible = (rs: Awaited<ReturnType<typeof run>>) => rs.filter((r) => r.eligible).map((r) => r.pathway);

  it("is deterministic: same input, same output", async () => {
    const t = now();
    const l = (await repo.listings.getById("l-1"))!;
    const args = { listing: l, reservations: await repo.reservations.listForListing("l-1"), hubs: await repo.hubs.list(), now: t };
    expect(recommend(args)).toEqual(recommend(args));
  });
  it("suggests buyers, a split and storage for good tomatoes, with reasons", async () => {
    const rs = await run("l-1");
    expect(eligible(rs)).toEqual(expect.arrayContaining(["match_buyer", "split_batch", "temporary_storage"]));
    expect(rs.find((r) => r.pathway === "split_batch")!.reasons[0].code).toBe("partlyReserved");
    expect(rs.find((r) => r.pathway === "temporary_storage")!.reasons.map((x) => x.code)).toContain("storageNotGuarantee");
  });
  it("never routes tomatoes to a cold-only hub", async () => {
    const rs = await run("l-1");
    expect(rs.find((r) => r.pathway === "temporary_storage")!.hubId).not.toBe("h-4");
  });
  it("FOOD SAFETY: poor condition blocks sale, storage and partner referral; only processing stays, after inspection", async () => {
    const rs = await run("l-1", { reportedCondition: "poor" });
    expect(eligible(rs)).toEqual(["food_processor"]);
    const proc = rs.find((r) => r.pathway === "food_processor")!;
    expect(proc.reasons.map((x) => x.code)).toEqual(expect.arrayContaining(["inspectFirst", "foodSafetyFirst"]));
    for (const p of ["match_buyer", "split_batch", "temporary_storage", "recovery_partner"]) {
      expect(rs.find((r) => r.pathway === p)!.blockers.map((x) => x.code)).toContain("poorCondition");
    }
  });
  it("blocks everything for produce that is sold out; says why", async () => {
    const rs = await run("l-5"); // fully reserved
    expect(rs.find((r) => r.pathway === "match_buyer")!.blockers.map((x) => x.code)).toContain("nothingAvailable");
  });
  it("opens the partner pathway only for safe produce close to its deadline", async () => {
    const soon = new Date(Date.now() + 6 * 3_600_000).toISOString();
    expect(eligible(await run("l-5", { availableKg: 20, reservedKg: 10, availability: "partly_reserved", recoverBy: soon }))).toContain("recovery_partner");
    expect(eligible(await run("l-1"))).not.toContain("recovery_partner"); // plenty of time
  });
  it("marks processor and partner as demonstration", async () => {
    const rs = await run("l-1");
    expect(rs.filter((r) => r.isDemo).map((r) => r.pathway)).toEqual(expect.arrayContaining(["food_processor", "recovery_partner"]));
  });
});

describe("impact", () => {
  const data = async () => ({
    listings: await repo.listings.list(),
    reservations: (await Promise.all((await repo.listings.list()).map((l) => repo.reservations.listForListing(l.id)))).flat(),
    bookings: await repo.hubs.listAllBookings(),
  });
  it("counts steps separately and never treats listed as saved", async () => {
    const f = Object.fromEntries(computeImpact(await data()).map((x) => [x.metric, x]));
    expect(f.collected.value).toBe(40);
    expect(f.verified_recovered.value).toBe(40);
    expect(f.listed.value).toBeGreaterThan(f.verified_recovered.value * 10);
    expect(f.estimated_value).toMatchObject({ value: 1200, unit: "INR", basis: "estimated" });
  });
  it("labels demo data as demo and keeps value an estimate", async () => {
    const demo = computeImpact(await data(), "demo");
    expect(demo.filter((x) => x.metric !== "estimated_value").every((x) => x.basis === "demo")).toBe(true);
    const live = Object.fromEntries(computeImpact(await data(), "live").map((x) => [x.metric, x.basis]));
    expect(live).toMatchObject({ listed: "estimated", collected: "verified", estimated_value: "estimated" });
  });
});
