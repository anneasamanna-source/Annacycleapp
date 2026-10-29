/** Shared vocabularies. Every list is a const tuple so types and validation stay in sync. */

export const ROLES = ["vendor", "buyer", "hub_operator", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PRODUCE_CATEGORIES = ["leafy", "fruiting", "root", "gourd"] as const;
export type ProduceCategory = (typeof PRODUCE_CATEGORIES)[number];

/** Only units with an exact kg value, so no invented conversions. */
export const UNITS = ["kg", "quintal"] as const;
export type Unit = (typeof UNITS)[number];
export const KG_PER_UNIT: Record<Unit, number> = { kg: 1, quintal: 100 };

/** Reported by the seller. It is a record of what was said, not a measurement. */
export const CONDITIONS = ["fresh", "good", "fair", "poor"] as const;
export type Condition = (typeof CONDITIONS)[number];

/** Lifecycle only. Reserved/available is derived from reservations, never stored. */
export const LISTING_STATUSES = ["active", "collected", "expired", "withdrawn", "redirected"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const RESERVATION_STATUSES = [
  "requested",
  "confirmed",
  "collected",
  "cancelled",
  "declined",
  "expired",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
/** Statuses that hold quantity. Cancelled, declined and expired release it. */
export const QUANTITY_HOLDING_RESERVATION: readonly ReservationStatus[] = [
  "requested",
  "confirmed",
  "collected",
];

export type Availability = "available" | "partly_reserved" | "fully_reserved";

export const HUB_TYPES = ["community_micro", "anna_modular", "partner"] as const;
export type HubType = (typeof HUB_TYPES)[number];

export const STORAGE_MODES = ["ventilated_ambient", "cool", "cold"] as const;
export type StorageMode = (typeof STORAGE_MODES)[number];

/** "sample" = demonstration data, never real availability. */
export const HUB_VERIFICATION = ["sample", "pending", "verified"] as const;
export type HubVerification = (typeof HUB_VERIFICATION)[number];

export const BOOKING_STATUSES = [
  "requested",
  "accepted",
  "checked_in",
  "released",
  "declined",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const CAPACITY_HOLDING_BOOKING: readonly BookingStatus[] = ["requested", "accepted", "checked_in"];

export const PATHWAYS = [
  "match_buyer",
  "split_batch",
  "temporary_storage",
  "food_processor",
  "recovery_partner",
] as const;
export type Pathway = (typeof PATHWAYS)[number];

/** Every impact figure carries one of these, and the UI renders them differently. */
export const DATA_BASES = ["verified", "estimated", "demo"] as const;
export type DataBasis = (typeof DATA_BASES)[number];

/** A booking is at most 3 days. That is a ceiling, never a promise the produce lasts. */
export const HARD_MAX_BOOKING_DAYS = 3;
export const CURRENCY = "INR";
