"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/session";
import { redirect } from "next/navigation";
import { getRepositories } from "@/lib/repositories";

/** Admin moderation: withdraw a listing. The repository re-checks that the actor is an admin or the seller. */
export async function withdrawListingAction(fd: FormData): Promise<void> {
  const actor = await getViewer();
  if (!actor) redirect("/login");
  await getRepositories().listings.setStatus({ id: String(fd.get("listingId") ?? ""), to: "withdrawn", actorId: actor.id });
  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
}
