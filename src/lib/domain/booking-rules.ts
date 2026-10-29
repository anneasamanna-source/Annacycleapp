import { CROP_PROFILES, type CropKey } from "./crop-profiles";
import { HARD_MAX_BOOKING_DAYS, type BookingStatus } from "./enums";
import type { Hub, HubBooking, User } from "./types";

/** Hub booking rules as pure functions, used by the repository's atomic step. */
export type BookingError =
  | "notVendor" | "notYourBatch" | "qtyInvalid" | "qtyTooMuch" | "daysInvalid" | "daysTooLong"
  | "categoryNotAccepted" | "storageIncompatible" | "noCapacity" | "hubNotFound";

export type BookingCheck =
  | { ok: true; quantityKg: number; days: number }
  | { ok: false; error: BookingError; limit?: number };

/** A stay is never more than 3 days, the hub's own limit, or the crop's limit, whichever is least. */
export const maxDaysFor = (hub: Pick<Hub, "maxBookingDays">, cropKey: CropKey) =>
  Math.min(HARD_MAX_BOOKING_DAYS, hub.maxBookingDays, CROP_PROFILES[cropKey].maxBookingDays);

export function storageFit(hub: Pick<Hub, "acceptedCategories" | "storageModes">, cropKey: CropKey) {
  const crop = CROP_PROFILES[cropKey];
  if (!hub.acceptedCategories.includes(crop.category)) return "categoryNotAccepted" as const;
  if (!hub.storageModes.some((m) => (crop.acceptableStorage as readonly string[]).includes(m))) {
    return "storageIncompatible" as const;
  }
  return "ok" as const;
}

export function checkBooking(args: {
  hub: Hub; freeKg: number; cropKey: CropKey; quantityKg: number; days: number; batchKg: number;
  user: Pick<User, "role">;
}): BookingCheck {
  const { hub, freeKg, cropKey, days, batchKg, user } = args;
  const quantityKg = Math.round(args.quantityKg * 100) / 100;
  if (user.role !== "vendor") return { ok: false, error: "notVendor" };
  if (!Number.isFinite(quantityKg) || quantityKg <= 0) return { ok: false, error: "qtyInvalid" };
  if (quantityKg > batchKg) return { ok: false, error: "qtyTooMuch", limit: batchKg };
  if (!Number.isInteger(days) || days < 1) return { ok: false, error: "daysInvalid" };
  const fit = storageFit(hub, cropKey);
  if (fit !== "ok") return { ok: false, error: fit };
  const max = maxDaysFor(hub, cropKey);
  if (days > max) return { ok: false, error: "daysTooLong", limit: max };
  if (quantityKg > freeKg) return { ok: false, error: "noCapacity", limit: freeKg };
  return { ok: true, quantityKg, days };
}

export function canActOnBooking(
  actor: Pick<User, "id" | "role">, hub: Pick<Hub, "operatorId">, booking: Pick<HubBooking, "vendorId">, to: BookingStatus,
): boolean {
  const operates = actor.role === "admin" || (actor.role === "hub_operator" && hub.operatorId === actor.id);
  if (operates) return ["accepted", "declined", "checked_in", "released"].includes(to);
  if (actor.id === booking.vendorId) return to === "cancelled";
  return false;
}
