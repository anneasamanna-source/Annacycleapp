import type {
  BookingStatus,
  Condition,
  DataBasis,
  HubType,
  HubVerification,
  ListingStatus,
  ProduceCategory,
  ReservationStatus,
  Role,
  StorageMode,
  Unit,
} from "./enums";
import type { CropKey } from "./crop-profiles";

/** ISO 8601 strings everywhere, so data survives JSON and a database unchanged. */
export type ISODate = string;

export type Place = {
  district: string;
  /** Approximate area only. Never an exact address. */
  area: string;
};

export type User = {
  id: string;
  name: string;
  role: Role;
  district: string;
  isDemo: boolean;
};

export type Listing = {
  id: string;
  /** Short human-readable batch identifier, e.g. AC-1001. */
  batchCode: string;
  sellerId: string;
  cropKey: CropKey;
  produceName: string;
  category: ProduceCategory;
  /** Canonical quantity in kg. The unit the seller typed is kept for display only. */
  totalKg: number;
  displayUnit: Unit;
  /** Price per kg, in CURRENCY. */
  askingPricePerKg: number;
  place: Place;
  reportedCondition: Condition;
  conditionNotes?: string;
  /** When the seller reported the condition. Shown next to the condition. */
  conditionReportedAt: ISODate;
  harvestedAt?: ISODate;
  purchasedAt?: ISODate;
  storageHistory?: string;
  collectionFrom: ISODate;
  collectionUntil: ISODate;
  /** Preferred recovery deadline: when the seller wants a result by. */
  recoverBy: ISODate;
  photoUrl?: string;
  status: ListingStatus;
  createdAt: ISODate;
  isDemo: boolean;
};

export type Reservation = {
  id: string;
  listingId: string;
  buyerId: string;
  quantityKg: number;
  status: ReservationStatus;
  createdAt: ISODate;
};

export type Hub = {
  id: string;
  name: string;
  type: HubType;
  place: Place;
  capacityKg: number;
  /** Occupancy reported for the sample hub. Bookings add to it. */
  occupiedKg: number;
  storageModes: StorageMode[];
  acceptedCategories: ProduceCategory[];
  opensAt: string; // "06:00"
  closesAt: string; // "20:00"
  costPerKgPerDay: number;
  /** The hub's own limit. Never above HARD_MAX_BOOKING_DAYS. */
  maxBookingDays: number;
  verification: HubVerification;
  /** True for the ANNA Modular Hub, which is a proposed design, not a built facility. */
  isConcept: boolean;
  /** The hub operator user who manages this hub, if any. */
  operatorId?: string;
  isDemo: boolean;
};

export type ConditionCheck = {
  at: ISODate;
  byUserId: string;
  condition: Condition;
  notes?: string;
};

export type HubBooking = {
  id: string;
  hubId: string;
  batchCode: string;
  vendorId: string;
  cropKey: CropKey;
  quantityKg: number;
  startsOn: ISODate;
  days: number;
  expectedReleaseAt: ISODate;
  status: BookingStatus;
  checks: ConditionCheck[];
  createdAt: ISODate;
};

/** One impact number with its evidence level. */
export type ImpactFigure = {
  metric:
    | "listed"
    | "matched"
    | "sold"
    | "collected"
    | "redirected"
    | "verified_recovered"
    | "estimated_value";
  value: number;
  unit: "kg" | "INR";
  basis: DataBasis;
};
