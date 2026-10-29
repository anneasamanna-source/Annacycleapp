"use server";

import { redirect } from "next/navigation";
import { getListingSeller } from "@/lib/session";
import { getRepositories } from "@/lib/repositories";
import { toNewListing, validateListing, type FieldErrors } from "@/lib/validation/listing";

export type FormState = { errors: FieldErrors; values: Record<string, string> };

export async function createListingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string" && !k.startsWith("$")) values[k] = v;

  // The server is the authority: the browser form only mirrors these rules.
  const result = validateListing(values, new Date());
  if (!result.ok) return { errors: result.errors, values };

  let id: string;
  try {
    const repos = getRepositories();
    // No real sign-in yet (Stage 10): demo listings use the chosen demo vendor, or the first sample vendor.
    const vendor = await getListingSeller();
    if (!vendor) throw new Error("No sample vendor");
    id = (await repos.listings.create(toNewListing(result.data, vendor.id))).id;
  } catch {
    return { errors: { form: "serverError" }, values };
  }
  redirect(`/surplus/created/${id}`);
}
