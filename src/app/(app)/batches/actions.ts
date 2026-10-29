"use server";

import { revalidatePath } from "next/cache";
import { BOOKING_STATUSES, CONDITIONS, type BookingStatus, type Condition } from "@/lib/domain/enums";
import { getViewer } from "@/lib/session";
import { redirect } from "next/navigation";
import { getRepositories } from "@/lib/repositories";
import type { BookingTransitionError } from "@/lib/repositories/interfaces";

export type BookingActionState = { error?: BookingTransitionError };

export async function bookingAction(_p: BookingActionState, fd: FormData): Promise<BookingActionState> {
  const bookingId = String(fd.get("bookingId") ?? "");
  const to = String(fd.get("to") ?? "");
  const cond = String(fd.get("condition") ?? "");
  const notes = String(fd.get("notes") ?? "").trim().slice(0, 200) || undefined;
  const condition = (CONDITIONS as readonly string[]).includes(cond) ? (cond as Condition) : undefined;
  const actor = await getViewer();
  if (!actor) redirect("/login");
  const { hubs } = getRepositories();

  const res = to === "record"
    ? condition ? await hubs.addCheck({ bookingId, actorId: actor.id, condition, notes }) : { ok: false as const, error: "checkRequired" as const }
    : (BOOKING_STATUSES as readonly string[]).includes(to)
      ? await hubs.transitionBooking({ bookingId, to: to as BookingStatus, actorId: actor.id, check: condition ? { condition, notes } : undefined })
      : { ok: false as const, error: "badTransition" as const };
  revalidatePath("/batches");
  revalidatePath("/hubs");
  return res.ok ? {} : { error: res.error };
}
