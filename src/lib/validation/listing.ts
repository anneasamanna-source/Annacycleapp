import { z } from "zod";
import { CROP_KEYS, CROP_PROFILES, type CropKey } from "../domain/crop-profiles";
import { CONDITIONS, UNITS, type Condition, type Unit } from "../domain/enums";
import { toKg } from "../domain/quantity";
import type { NewListing } from "../repositories/interfaces";

/** Every key must exist in the surplus.errors section of both language files. */
export type ErrorKey =
  | "required" | "pick" | "numInvalid" | "qtyMin" | "qtyMax" | "priceMin" | "priceMax"
  | "textMax" | "dateInvalid" | "dateFuture" | "collectEnd" | "recoverPast"
  | "recoverBeforeCollect" | "serverError";

export const FIELDS = [
  "crop", "name", "quantity", "unit", "price", "district", "area", "condition", "notes",
  "harvested", "purchased", "storage", "collectFrom", "collectUntil", "recoverBy",
] as const;
export type FieldName = (typeof FIELDS)[number];
export type FieldErrors = Partial<Record<FieldName | "form", ErrorKey>>;

export const DISTRICTS = [
  "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly",
  "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia",
  "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman",
  "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur",
] as const;

export const LIMITS = { maxKg: 100_000, maxPricePerKg: 10_000, maxText: 200 } as const;

/** Accepts Bengali digits and thousands commas, so "১,০০" works like "100". */
export function normalizeNumber(s: string): string {
  return s.replace(/[০-৯]/g, (c) => String("০১২৩৪৫৬৭৮৯".indexOf(c))).replace(/,/g, "").trim();
}

/** datetime-local gives "YYYY-MM-DDTHH:mm". We treat it as Indian time. */
export function parseIst(v: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const required = z.string().trim().min(1, "required");
const optionalText = z
  .string()
  .trim()
  .max(LIMITS.maxText, "textMax")
  .transform((v) => v || undefined);
const number = (invalid: ErrorKey = "numInvalid") =>
  required.transform(normalizeNumber).transform(Number).refine((n) => Number.isFinite(n), invalid);
const dateRequired = required
  .refine((v) => parseIst(v) !== null, "dateInvalid")
  .transform((v) => parseIst(v) as Date);
const dateOptional = z
  .string()
  .trim()
  .refine((v) => v === "" || parseIst(v) !== null, "dateInvalid")
  .transform((v) => (v ? (parseIst(v) as Date) : undefined));

const schema = z.object({
  crop: required.refine((v) => (CROP_KEYS as string[]).includes(v), "pick"),
  name: optionalText,
  quantity: number().refine((n) => n > 0, "qtyMin"),
  unit: required.refine((v) => (UNITS as readonly string[]).includes(v), "pick"),
  price: number().refine((n) => n > 0, "priceMin").refine((n) => n <= LIMITS.maxPricePerKg, "priceMax"),
  district: required.refine((v) => (DISTRICTS as readonly string[]).includes(v), "pick"),
  area: required.pipe(z.string().max(80, "textMax")),
  condition: required.refine((v) => (CONDITIONS as readonly string[]).includes(v), "pick"),
  notes: optionalText,
  harvested: dateOptional,
  purchased: dateOptional,
  storage: optionalText,
  collectFrom: dateRequired,
  collectUntil: dateRequired,
  recoverBy: dateRequired,
});

export type ValidListing = {
  cropKey: CropKey; produceName: string; totalKg: number; unit: Unit; pricePerKg: number;
  district: string; area: string; condition: Condition; notes?: string; storage?: string;
  harvestedAt?: Date; purchasedAt?: Date; collectFrom: Date; collectUntil: Date; recoverBy: Date;
};

export function validateListing(
  raw: Record<string, string | undefined>,
  now: Date,
): { ok: true; data: ValidListing } | { ok: false; errors: FieldErrors } {
  const input = Object.fromEntries(FIELDS.map((f) => [f, raw[f] ?? ""]));
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as FieldName;
      if (!errors[field]) errors[field] = issue.message as ErrorKey;
    }
    return { ok: false, errors };
  }

  const v = parsed.data;
  const unit = v.unit as Unit;
  const totalKg = toKg(v.quantity, unit);
  const errors: FieldErrors = {};
  if (totalKg > LIMITS.maxKg) errors.quantity = "qtyMax";
  if (v.harvested && v.harvested > now) errors.harvested = "dateFuture";
  if (v.purchased && v.purchased > now) errors.purchased = "dateFuture";
  if (v.collectUntil <= v.collectFrom) errors.collectUntil = "collectEnd";
  if (v.recoverBy <= now) errors.recoverBy = "recoverPast";
  else if (v.recoverBy <= v.collectFrom) errors.recoverBy = "recoverBeforeCollect";
  if (Object.keys(errors).length) return { ok: false, errors };

  const cropKey = v.crop as CropKey;
  return {
    ok: true,
    data: {
      cropKey, totalKg, unit, pricePerKg: v.price, district: v.district, area: v.area,
      produceName: v.name ?? CROP_PROFILES[cropKey].nameEn, condition: v.condition as Condition,
      notes: v.notes, storage: v.storage, harvestedAt: v.harvested, purchasedAt: v.purchased,
      collectFrom: v.collectFrom, collectUntil: v.collectUntil, recoverBy: v.recoverBy,
    },
  };
}

export function toNewListing(v: ValidListing, sellerId: string): NewListing {
  return {
    sellerId, cropKey: v.cropKey, produceName: v.produceName, category: CROP_PROFILES[v.cropKey].category,
    totalKg: v.totalKg, displayUnit: v.unit, askingPricePerKg: v.pricePerKg,
    place: { district: v.district, area: v.area }, reportedCondition: v.condition,
    conditionNotes: v.notes, harvestedAt: v.harvestedAt?.toISOString(), purchasedAt: v.purchasedAt?.toISOString(),
    storageHistory: v.storage, collectionFrom: v.collectFrom.toISOString(),
    collectionUntil: v.collectUntil.toISOString(), recoverBy: v.recoverBy.toISOString(),
  };
}
