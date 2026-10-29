/**
 * SAMPLE DATA. Every person, listing, hub and booking below is invented for demonstration.
 * Times are relative to "now" so the demo always looks current.
 * Nothing here is real availability.
 */
import type { Hub, HubBooking, Listing, Reservation, User } from "../../lib/domain/types";

const H = 3_600_000;
export type Credential = { userId: string; email: string; passwordHash: string };
export type SessionRow = { tokenHash: string; userId: string; expiresAt: string };
export type Seed = {
  users: User[]; listings: Listing[]; reservations: Reservation[]; hubs: Hub[]; bookings: HubBooking[];
  /** Account logins and sessions. Only used when ANNA_DATA_MODE=local. Never sent to the browser. */
  credentials: Credential[]; sessions: SessionRow[];
  /** Id counters live in the store so they survive a restart. */
  seq: { listing: number; reservation: number; booking: number };
};

export function createSeed(now = new Date()): Seed {
  const at = (hours: number) => new Date(now.getTime() + hours * H).toISOString();

  const users: User[] = [
    { id: "u-v1", name: "Anwar", role: "vendor", district: "North 24 Parganas", isDemo: true },
    { id: "u-v2", name: "Sumitra", role: "vendor", district: "Hooghly", isDemo: true },
    { id: "u-v3", name: "Biplab", role: "vendor", district: "Nadia", isDemo: true },
    { id: "u-b1", name: "Green Basket Retail", role: "buyer", district: "Kolkata", isDemo: true },
    { id: "u-b2", name: "Tarun's Kitchen", role: "buyer", district: "North 24 Parganas", isDemo: true },
    { id: "u-b3", name: "Local Wholesaler", role: "buyer", district: "Howrah", isDemo: true },
    { id: "u-o1", name: "Hub Operator", role: "hub_operator", district: "North 24 Parganas", isDemo: true },
    { id: "u-a1", name: "Administrator", role: "admin", district: "Kolkata", isDemo: true },
  ];

  const base = { conditionReportedAt: at(-2), status: "active" as const, createdAt: at(-3), isDemo: true };

  const listings: Listing[] = [
    { ...base, id: "l-1", batchCode: "AC-1001", sellerId: "u-v1", cropKey: "tomato", produceName: "Tomatoes",
      category: "fruiting", totalKg: 100, displayUnit: "kg", askingPricePerKg: 24,
      place: { district: "North 24 Parganas", area: "Barrackpore side" },
      reportedCondition: "good", conditionNotes: "Firm, a few split fruit set aside.",
      harvestedAt: at(-20), storageHistory: "Kept in shade, open crates.",
      collectionFrom: at(2), collectionUntil: at(30), recoverBy: at(36), photoUrl: "/demo/tomato.webp" },
    { ...base, id: "l-2", batchCode: "AC-1002", sellerId: "u-v2", cropKey: "carrot", produceName: "Carrots",
      category: "root", totalKg: 60, displayUnit: "kg", askingPricePerKg: 32,
      place: { district: "Hooghly", area: "Chinsurah" }, reportedCondition: "fresh",
      harvestedAt: at(-12), collectionFrom: at(1), collectionUntil: at(48), recoverBy: at(60),
      photoUrl: "/demo/carrot.webp" },
    { ...base, id: "l-3", batchCode: "AC-1003", sellerId: "u-v2", cropKey: "beetroot", produceName: "Beetroot",
      category: "root", totalKg: 45, displayUnit: "kg", askingPricePerKg: 28,
      place: { district: "Hooghly", area: "Chinsurah" }, reportedCondition: "fair",
      conditionNotes: "Leaves wilted, roots firm.", purchasedAt: at(-30),
      collectionFrom: at(3), collectionUntil: at(36), recoverBy: at(40), photoUrl: "/demo/beet.webp" },
    { ...base, id: "l-4", batchCode: "AC-1004", sellerId: "u-v2", cropKey: "pumpkin", produceName: "Pumpkins",
      category: "gourd", totalKg: 250, displayUnit: "quintal", askingPricePerKg: 14,
      place: { district: "Hooghly", area: "Serampore side" }, reportedCondition: "good",
      harvestedAt: at(-48), collectionFrom: at(4), collectionUntil: at(72), recoverBy: at(84),
      photoUrl: "/demo/pumpkin.webp" },
    { ...base, id: "l-9", batchCode: "AC-0980", sellerId: "u-v2", cropKey: "carrot", produceName: "Carrots",
      category: "root", totalKg: 40, displayUnit: "kg", askingPricePerKg: 30, status: "collected",
      place: { district: "Hooghly", area: "Chinsurah" }, reportedCondition: "good", harvestedAt: at(-80),
      collectionFrom: at(-60), collectionUntil: at(-30), recoverBy: at(-24), photoUrl: "/demo/carrot.webp" },
    { ...base, id: "l-10", batchCode: "AC-0981", sellerId: "u-v3", cropKey: "beetroot", produceName: "Beetroot",
      category: "root", totalKg: 25, displayUnit: "kg", askingPricePerKg: 26, status: "redirected",
      place: { district: "Nadia", area: "Kalyani side" }, reportedCondition: "fair", harvestedAt: at(-90),
      collectionFrom: at(-70), collectionUntil: at(-40), recoverBy: at(-30), photoUrl: "/demo/beet.webp" },
    { ...base, id: "l-5", batchCode: "AC-1005", sellerId: "u-v3", cropKey: "bitter_gourd", produceName: "Bitter gourd",
      category: "gourd", totalKg: 30, displayUnit: "kg", askingPricePerKg: 45,
      place: { district: "Nadia", area: "Kalyani side" }, reportedCondition: "good",
      harvestedAt: at(-10), collectionFrom: at(2), collectionUntil: at(30), recoverBy: at(34),
      photoUrl: "/demo/gourd.webp" },
    { ...base, id: "l-6", batchCode: "AC-1006", sellerId: "u-v3", cropKey: "leafy_greens", produceName: "Spinach (palong)",
      category: "leafy", totalKg: 20, displayUnit: "kg", askingPricePerKg: 18,
      place: { district: "Howrah", area: "Bally side" }, reportedCondition: "fair",
      conditionNotes: "Some wilting at edges.", harvestedAt: at(-14),
      collectionFrom: at(1), collectionUntil: at(10), recoverBy: at(12) },
    { ...base, id: "l-7", batchCode: "AC-1007", sellerId: "u-v1", cropKey: "brinjal", produceName: "Brinjal",
      category: "fruiting", totalKg: 80, displayUnit: "kg", askingPricePerKg: 26,
      place: { district: "North 24 Parganas", area: "Bhatpara side" }, reportedCondition: "fair",
      conditionNotes: "Some skin marks.", harvestedAt: at(-26),
      collectionFrom: at(2), collectionUntil: at(28), recoverBy: at(30) },
    { ...base, id: "l-8", batchCode: "AC-1008", sellerId: "u-v3", cropKey: "potato", produceName: "Potatoes",
      category: "root", totalKg: 300, displayUnit: "kg", askingPricePerKg: 20,
      place: { district: "Purba Bardhaman", area: "Burdwan side" }, reportedCondition: "good",
      harvestedAt: at(-72), collectionFrom: at(6), collectionUntil: at(96), recoverBy: at(120) },
  ];

  // The 100 kg tomato example: 40 + 35 reserved, 25 still open.
  const reservations: Reservation[] = [
    { id: "r-1", listingId: "l-1", buyerId: "u-b1", quantityKg: 40, status: "confirmed", createdAt: at(-1) },
    { id: "r-2", listingId: "l-1", buyerId: "u-b2", quantityKg: 35, status: "requested", createdAt: at(-0.5) },
    { id: "r-3", listingId: "l-2", buyerId: "u-b3", quantityKg: 20, status: "requested", createdAt: at(-0.5) },
    { id: "r-5", listingId: "l-9", buyerId: "u-b1", quantityKg: 40, status: "collected", createdAt: at(-70) },
    { id: "r-4", listingId: "l-5", buyerId: "u-b1", quantityKg: 30, status: "confirmed", createdAt: at(-1) },
  ];

  const hubBase = { verification: "sample" as const, isDemo: true };
  const hubs: Hub[] = [
    { ...hubBase, id: "h-1", operatorId: "u-o1", name: "Sample Micro-Hub: Barrackpore", type: "community_micro",
      place: { district: "North 24 Parganas", area: "Barrackpore" }, capacityKg: 800, occupiedKg: 280,
      storageModes: ["ventilated_ambient"], acceptedCategories: ["fruiting", "gourd", "root"],
      opensAt: "06:00", closesAt: "20:00", costPerKgPerDay: 0.5, maxBookingDays: 2, isConcept: false },
    { ...hubBase, id: "h-2", operatorId: "u-o1", name: "Sample Micro-Hub: Chinsurah", type: "community_micro",
      place: { district: "Hooghly", area: "Chinsurah" }, capacityKg: 500, occupiedKg: 120,
      storageModes: ["ventilated_ambient"], acceptedCategories: ["fruiting", "gourd", "root"],
      opensAt: "07:00", closesAt: "19:00", costPerKgPerDay: 0.4, maxBookingDays: 2, isConcept: false },
    { ...hubBase, id: "h-3", name: "ANNA Modular Hub (concept): Kalyani", type: "anna_modular",
      place: { district: "Nadia", area: "Kalyani" }, capacityKg: 1200, occupiedKg: 0,
      storageModes: ["ventilated_ambient", "cool"], acceptedCategories: ["fruiting", "gourd", "root", "leafy"],
      opensAt: "05:00", closesAt: "22:00", costPerKgPerDay: 0.9, maxBookingDays: 3, isConcept: true },
    { ...hubBase, id: "h-4", name: "Sample Partner Storage: Howrah", type: "partner",
      place: { district: "Howrah", area: "Howrah" }, capacityKg: 2000, occupiedKg: 1350,
      storageModes: ["cool", "cold"], acceptedCategories: ["root", "leafy"],
      opensAt: "06:00", closesAt: "18:00", costPerKgPerDay: 1.2, maxBookingDays: 3, isConcept: false },
    { ...hubBase, id: "h-5", name: "Sample Partner Storage: Burdwan", type: "partner",
      place: { district: "Purba Bardhaman", area: "Burdwan" }, capacityKg: 1500, occupiedKg: 600,
      storageModes: ["ventilated_ambient", "cool"], acceptedCategories: ["root", "gourd", "fruiting"],
      opensAt: "06:00", closesAt: "18:00", costPerKgPerDay: 0.8, maxBookingDays: 3, isConcept: false },
  ];

  const bookings: HubBooking[] = [
    { id: "b-1", hubId: "h-1", batchCode: "AC-0990", vendorId: "u-v1", cropKey: "brinjal", quantityKg: 60,
      startsOn: at(-6), days: 2, expectedReleaseAt: at(42), status: "checked_in", createdAt: at(-8),
      checks: [{ at: at(-6), byUserId: "u-o1", condition: "fair", notes: "Skin marks on a few pieces." }] },
    { id: "b-2", hubId: "h-1", batchCode: "AC-0995", vendorId: "u-v1", cropKey: "pumpkin", quantityKg: 150,
      startsOn: at(18), days: 3, expectedReleaseAt: at(90), status: "requested", createdAt: at(-1), checks: [] },
    { id: "b-3", hubId: "h-2", batchCode: "AC-1002", vendorId: "u-v2", cropKey: "carrot", quantityKg: 30,
      startsOn: at(1), days: 2, expectedReleaseAt: at(49), status: "accepted", createdAt: at(-2), checks: [] },
  ];

  return { users, listings, reservations, hubs, bookings, credentials: [], sessions: [], seq: { listing: 1100, reservation: 100, booking: 100 } };
}
