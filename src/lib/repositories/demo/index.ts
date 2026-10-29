import { CROP_PROFILES } from "../../domain/crop-profiles";
import { canActOnBooking, checkBooking } from "../../domain/booking-rules";
import { canActOnReservation, checkReservation } from "../../domain/reservation-rules";
import { BOOKING_TRANSITIONS, LISTING_TRANSITIONS, RESERVATION_TRANSITIONS, canTransition } from "../../domain/status-machine";
import { CAPACITY_HOLDING_BOOKING } from "../../domain/enums";
import { availabilityOf, availableKg, reservedKg } from "../../domain/quantity";
import type { HubBooking, Listing, Reservation } from "../../domain/types";
import type { HubView, ListingView, Repositories } from "../interfaces";

import { localAuth } from "./auth";
import { isLocalMode, persist, store } from "./store";

export { resetDemoStore } from "./store";

function toView(listing: Listing): ListingView {
  const s = store();
  const own = s.reservations.filter((r) => r.listingId === listing.id);
  const reserved = reservedKg(own);
  const seller = s.users.find((u) => u.id === listing.sellerId);
  return {
    ...listing,
    reservedKg: reserved,
    availableKg: availableKg(listing, own),
    availability: availabilityOf(listing.totalKg, reserved),
    seller: { id: listing.sellerId, name: seller?.name ?? "Unknown", district: seller?.district ?? "" },
  };
}

function toHubView(hubId: string): HubView | null {
  const s = store();
  const hub = s.hubs.find((h) => h.id === hubId);
  if (!hub) return null;
  const bookedKg = s.bookings
    .filter((b) => b.hubId === hub.id && CAPACITY_HOLDING_BOOKING.includes(b.status))
    .reduce((sum, b) => sum + b.quantityKg, 0);
  return { ...hub, bookedKg, availableKg: Math.max(0, hub.capacityKg - hub.occupiedKg - bookedKg) };
}

export const demoRepositories: Repositories = {
  auth: localAuth,
  listings: {
    async list(f = {}) {
      const q = f.q?.trim().toLowerCase();
      let rows = store().listings.map(toView);
      if (q) rows = rows.filter((l) => `${l.produceName} ${l.place.area} ${l.place.district}`.toLowerCase().includes(q));
      if (f.category) rows = rows.filter((l) => l.category === f.category);
      if (f.district) rows = rows.filter((l) => l.place.district === f.district);
      if (f.onlyAvailable) rows = rows.filter((l) => l.status === "active" && l.availableKg > 0);
      const sorts = {
        newest: (a: ListingView, b: ListingView) => b.createdAt.localeCompare(a.createdAt),
        deadline: (a: ListingView, b: ListingView) => a.recoverBy.localeCompare(b.recoverBy),
        price_asc: (a: ListingView, b: ListingView) => a.askingPricePerKg - b.askingPricePerKg,
        price_desc: (a: ListingView, b: ListingView) => b.askingPricePerKg - a.askingPricePerKg,
        quantity_desc: (a: ListingView, b: ListingView) => b.availableKg - a.availableKg,
      };
      return rows.sort(sorts[f.sort ?? "newest"]);
    },
    async getById(id) {
      const l = store().listings.find((x) => x.id === id);
      return l ? toView(l) : null;
    },
    async create(input) {
      const s = store();
      const n = ++s.seq.listing;
      const now = new Date().toISOString();
      const listing: Listing = {
        ...input,
        id: `l-${n}`,
        batchCode: `AC-${n}`,
        status: "active",
        createdAt: now,
        conditionReportedAt: now,
        isDemo: !isLocalMode(),
      };
      s.listings.unshift(listing);
      persist();
      return listing;
    },
    async setStatus({ id, to, actorId }) {
      const s = store();
      const listing = s.listings.find((l) => l.id === id);
      const actor = s.users.find((u) => u.id === actorId);
      if (!listing || !actor) return { ok: false, error: "notFound" };
      if (actor.role !== "admin" && actor.id !== listing.sellerId) return { ok: false, error: "forbidden" };
      if (!canTransition(LISTING_TRANSITIONS, listing.status, to)) return { ok: false, error: "badTransition" };
      listing.status = to;
      persist();
      return { ok: true };
    },
  },
  reservations: {
    async listForListing(id) {
      return store().reservations.filter((r) => r.listingId === id);
    },
    async listForBuyer(id) {
      return store().reservations.filter((r) => r.buyerId === id);
    },
    // IMPORTANT: no `await` between the check and the write below. JavaScript runs this whole
    // function without interruption, so two simultaneous requests cannot both pass the check.
    async reserve({ listingId, buyerId, quantityKg }) {
      const s = store();
      const listing = s.listings.find((l) => l.id === listingId);
      const buyer = s.users.find((u) => u.id === buyerId);
      if (!listing || !buyer) return { ok: false, error: "listingClosed", availableKg: 0 };
      const own = s.reservations.filter((r) => r.listingId === listingId);
      const check = checkReservation({ listing, reservations: own, buyer, requestedKg: quantityKg, now: new Date() });
      if (!check.ok) return check;
      const reservation: Reservation = {
        id: `r-${++s.seq.reservation}`,
        listingId, buyerId, quantityKg: check.quantityKg, status: "requested", createdAt: new Date().toISOString(),
      };
      s.reservations.push(reservation);
      persist();
      return { ok: true, reservation, availableKg: availableKg(listing, [...own, reservation]) };
    },
    async transition({ reservationId, to, actorId }) {
      const s = store();
      const reservation = s.reservations.find((r) => r.id === reservationId);
      const listing = s.listings.find((l) => l.id === reservation?.listingId);
      if (!reservation || !listing) return { ok: false, error: "notFound" };
      if (!canActOnReservation({ id: actorId }, listing, reservation, to)) return { ok: false, error: "forbidden" };
      if (!canTransition(RESERVATION_TRANSITIONS, reservation.status, to)) return { ok: false, error: "badTransition" };
      reservation.status = to;
      // When every kilogram has been collected, the listing itself is complete.
      const collected = s.reservations
        .filter((r) => r.listingId === listing.id && r.status === "collected")
        .reduce((sum, r) => sum + r.quantityKg, 0);
      if (collected >= listing.totalKg) listing.status = "collected";
      persist();
      return { ok: true, reservation };
    },
  },
  hubs: {
    async list(f = {}) {
      const crop = f.cropKey ? CROP_PROFILES[f.cropKey] : undefined;
      return store()
        .hubs.map((h) => toHubView(h.id)!)
        .filter((h) => !f.district || h.place.district === f.district)
        .filter((h) => !f.type || h.type === f.type)
        .filter((h) => !f.storageMode || h.storageModes.includes(f.storageMode))
        .filter((h) => !crop || (h.acceptedCategories.includes(crop.category) &&
          h.storageModes.some((m) => (crop.acceptableStorage as readonly string[]).includes(m))));
    },
    async getById(id) {
      return toHubView(id);
    },
    async listBookings(hubId, statuses) {
      return store().bookings.filter((b) => b.hubId === hubId && (!statuses || statuses.includes(b.status)));
    },
    async listAllBookings() {
      return store().bookings;
    },
    // No `await` between the capacity check and the write, so two requests cannot both fit the last space.
    async requestBooking({ hubId, vendorId, batchCode, quantityKg, days }) {
      const s = store();
      const hubView = toHubView(hubId);
      const user = s.users.find((u) => u.id === vendorId);
      const listing = s.listings.find((l) => l.batchCode === batchCode);
      if (!hubView || !user) return { ok: false, error: "hubNotFound" };
      if (!listing || listing.sellerId !== vendorId || listing.status !== "active") return { ok: false, error: "notYourBatch" };
      const check = checkBooking({ hub: hubView, freeKg: hubView.availableKg, cropKey: listing.cropKey, quantityKg, days, batchKg: listing.totalKg, user });
      if (!check.ok) return check;
      const now = Date.now();
      const booking: HubBooking = {
        id: `b-${++s.seq.booking}`, hubId, batchCode, vendorId, cropKey: listing.cropKey,
        quantityKg: check.quantityKg, startsOn: new Date(now).toISOString(), days: check.days,
        expectedReleaseAt: new Date(now + check.days * 86_400_000).toISOString(), status: "requested",
        checks: [], createdAt: new Date(now).toISOString(),
      };
      s.bookings.push(booking);
      persist();
      return { ok: true, booking };
    },
    async transitionBooking({ bookingId, to, actorId, check }) {
      const s = store();
      const booking = s.bookings.find((b) => b.id === bookingId);
      const hub = s.hubs.find((h) => h.id === booking?.hubId);
      const actor = s.users.find((u) => u.id === actorId);
      if (!booking || !hub || !actor) return { ok: false, error: "notFound" };
      if (!canActOnBooking(actor, hub, booking, to)) return { ok: false, error: "forbidden" };
      if (!canTransition(BOOKING_TRANSITIONS, booking.status, to)) return { ok: false, error: "badTransition" };
      if (to === "checked_in" && !check) return { ok: false, error: "checkRequired" };
      if (check) booking.checks.push({ at: new Date().toISOString(), byUserId: actorId, condition: check.condition, notes: check.notes });
      booking.status = to;
      persist();
      return { ok: true, booking };
    },
    async addCheck({ bookingId, actorId, condition, notes }) {
      const s = store();
      const booking = s.bookings.find((b) => b.id === bookingId);
      const hub = s.hubs.find((h) => h.id === booking?.hubId);
      const actor = s.users.find((u) => u.id === actorId);
      if (!booking || !hub || !actor) return { ok: false, error: "notFound" };
      if (!canActOnBooking(actor, hub, booking, "released")) return { ok: false, error: "forbidden" };
      if (booking.status !== "checked_in") return { ok: false, error: "badTransition" };
      booking.checks.push({ at: new Date().toISOString(), byUserId: actorId, condition, notes });
      persist();
      return { ok: true, booking };
    },
  },
  users: {
    async getById(id) {
      return store().users.find((u) => u.id === id) ?? null;
    },
    async listByRole(role) {
      return store().users.filter((u) => u.role === role);
    },
    async listAll() {
      return store().users;
    },
  },
};
