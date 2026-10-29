import type { Availability, BookingStatus, Condition, ListingStatus, ReservationStatus, HubType, ProduceCategory, StorageMode } from "../domain/enums";
import type { CropKey } from "../domain/crop-profiles";
import type { BookingError } from "../domain/booking-rules";
import type { ReserveError } from "../domain/reservation-rules";
import type { Hub, HubBooking, Listing, Reservation, User } from "../domain/types";

/** A listing plus what the UI needs: derived quantities and the seller's public details. */
export type ListingView = Listing & {
  reservedKg: number;
  availableKg: number;
  availability: Availability;
  seller: Pick<User, "id" | "name" | "district">;
};

export type ListingSort = "newest" | "deadline" | "price_asc" | "price_desc" | "quantity_desc";

export type ListingFilters = {
  q?: string;
  category?: ProduceCategory;
  district?: string;
  onlyAvailable?: boolean;
  sort?: ListingSort;
};

export type NewListing = Omit<
  Listing,
  "id" | "batchCode" | "createdAt" | "status" | "isDemo" | "conditionReportedAt"
>;

export type HubFilters = {
  district?: string;
  type?: HubType;
  cropKey?: CropKey;
  storageMode?: StorageMode;
};

export type HubView = Hub & { bookedKg: number; availableKg: number };

export interface ListingRepository {
  list(filters?: ListingFilters): Promise<ListingView[]>;
  getById(id: string): Promise<ListingView | null>;
  create(input: NewListing): Promise<Listing>;
  /** Sellers and admins only. Follows the listing status machine. */
  setStatus(input: { id: string; to: ListingStatus; actorId: string }): Promise<TransitionResult2>;
}

export type TransitionResult2 = { ok: true } | { ok: false; error: TransitionError };

export type ReserveResult =
  | { ok: true; reservation: Reservation; availableKg: number }
  | { ok: false; error: ReserveError; availableKg: number };

export type TransitionError = "notFound" | "forbidden" | "badTransition";
export type TransitionResult = { ok: true; reservation: Reservation } | { ok: false; error: TransitionError };

export interface ReservationRepository {
  listForListing(listingId: string): Promise<Reservation[]>;
  listForBuyer(buyerId: string): Promise<Reservation[]>;
  /**
   * Check and write must happen as ONE atomic step, so two buyers can never claim the same kilograms.
   * Demo: runs synchronously with no await inside. Supabase (Stage 10): a SQL function with a row lock.
   */
  reserve(input: { listingId: string; buyerId: string; quantityKg: number }): Promise<ReserveResult>;
  transition(input: { reservationId: string; to: ReservationStatus; actorId: string }): Promise<TransitionResult>;
}

export type BookingResult =
  | { ok: true; booking: HubBooking }
  | { ok: false; error: BookingError; limit?: number };
export type BookingTransitionError = TransitionError | "checkRequired";
export type BookingTransitionResult = { ok: true; booking: HubBooking } | { ok: false; error: BookingTransitionError };

export interface HubRepository {
  list(filters?: HubFilters): Promise<HubView[]>;
  getById(id: string): Promise<HubView | null>;
  listBookings(hubId: string, statuses?: BookingStatus[]): Promise<HubBooking[]>;
  listAllBookings(): Promise<HubBooking[]>;
  /** Atomic like reserve(): capacity is checked and the booking written in one step. */
  requestBooking(input: { hubId: string; vendorId: string; batchCode: string; quantityKg: number; days: number }): Promise<BookingResult>;
  transitionBooking(input: {
    bookingId: string; to: BookingStatus; actorId: string; check?: { condition: Condition; notes?: string };
  }): Promise<BookingTransitionResult>;
  addCheck(input: { bookingId: string; actorId: string; condition: Condition; notes?: string }): Promise<BookingTransitionResult>;
}

export interface UserRepository {
  getById(id: string): Promise<User | null>;
  listByRole(role: User["role"]): Promise<User[]>;
  listAll(): Promise<User[]>;
}

export type RegisterInput = { name: string; email: string; password: string; role: "vendor" | "buyer"; district: string };
export interface AuthRepository {
  register(input: RegisterInput): Promise<{ ok: true; user: User } | { ok: false; error: "emailTaken" }>;
  /** Same "badLogin" for unknown email and wrong password, so accounts can't be discovered. */
  verify(email: string, password: string): Promise<{ ok: true; user: User } | { ok: false; error: "badLogin" | "tooMany" }>;
  createSession(userId: string): Promise<{ token: string; expiresAt: string }>;
  userForSession(token: string): Promise<User | null>;
  deleteSession(token: string): Promise<void>;
}

/** The only thing the rest of the app depends on. Demo and Supabase both implement it. */
export interface Repositories {
  auth: AuthRepository;
  listings: ListingRepository;
  reservations: ReservationRepository;
  hubs: HubRepository;
  users: UserRepository;
}
