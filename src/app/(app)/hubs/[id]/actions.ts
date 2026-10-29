"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BookingError } from "@/lib/domain/booking-rules";
import { getViewer } from "@/lib/session";
import { getRepositories } from "@/lib/repositories";
import { normalizeNumber } from "@/lib/validation/listing";

export type BookingState = { error?: BookingError; limit?: number; values?: Record<string, string> };

export async function requestBookingAction(_p: BookingState, fd: FormData): Promise<BookingState> {
  const values = { batch: String(fd.get("batch") ?? ""), quantity: String(fd.get("quantity") ?? ""), days: String(fd.get("days") ?? "1") };
  const user = await getViewer();
  if (!user) redirect("/login");
  const res = await getRepositories().hubs.requestBooking({
    hubId: String(fd.get("hubId") ?? ""), vendorId: user.id, batchCode: values.batch,
    quantityKg: Number(normalizeNumber(values.quantity)), days: Number(values.days),
  });
  if (!res.ok) return { error: res.error, limit: res.limit, values };
  revalidatePath("/hubs");
  redirect("/batches?booked=1");
}
