"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RESERVATION_STATUSES, type ReservationStatus } from "@/lib/domain/enums";
import type { ReserveError } from "@/lib/domain/reservation-rules";
import { getViewer } from "@/lib/session";
import { getRepositories } from "@/lib/repositories";
import type { TransitionError } from "@/lib/repositories/interfaces";
import { normalizeNumber } from "@/lib/validation/listing";

export type ReserveState = {
  error?: ReserveError;
  availableKg?: number;
  values?: { quantity: string };
};
export type TransitionState = { error?: TransitionError; done?: boolean };

export async function reserveAction(_prev: ReserveState, formData: FormData): Promise<ReserveState> {
  const listingId = String(formData.get("listingId") ?? "");
  const quantity = String(formData.get("quantity") ?? "");
  const repos = getRepositories();
  const user = await getViewer();
  if (!user) redirect("/login");

  let quantityKg = Number(normalizeNumber(quantity));
  if (formData.get("mode") === "all") {
    quantityKg = (await repos.listings.getById(listingId))?.availableKg ?? 0;
  }
  // The server checks everything again. The form is only a convenience.
  const result = await repos.reservations.reserve({ listingId, buyerId: user.id, quantityKg });
  revalidatePath(`/marketplace/${listingId}`);
  revalidatePath("/marketplace");
  if (!result.ok) return { error: result.error, availableKg: result.availableKg, values: { quantity } };
  // Redirect so the confirmation shows at the top of the page (works without JavaScript too).
  redirect(`/marketplace/${listingId}?reserved=${result.reservation.quantityKg}`);
}

export async function transitionAction(_prev: TransitionState, formData: FormData): Promise<TransitionState> {
  const reservationId = String(formData.get("reservationId") ?? "");
  const listingId = String(formData.get("listingId") ?? "");
  const to = String(formData.get("to") ?? "");
  if (!(RESERVATION_STATUSES as readonly string[]).includes(to)) return { error: "badTransition" };
  const user = await getViewer();
  if (!user) redirect("/login");
  const result = await getRepositories().reservations.transition({
    reservationId, to: to as ReservationStatus, actorId: user.id,
  });
  revalidatePath(`/marketplace/${listingId}`);
  revalidatePath("/marketplace");
  return result.ok ? { done: true } : { error: result.error };
}
