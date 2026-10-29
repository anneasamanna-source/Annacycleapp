import { maxDaysFor, storageFit } from "../domain/booking-rules";
import { CROP_PROFILES } from "../domain/crop-profiles";
import { QUANTITY_HOLDING_RESERVATION, type Pathway } from "../domain/enums";
import type { Reservation } from "../domain/types";
import type { HubView, ListingView } from "../repositories/interfaces";

/**
 * Food Recovery Engine: transparent, rule-based, deterministic. No AI model.
 * Same input always gives the same output. Every suggestion carries its reasons,
 * and every unavailable pathway carries the reason it is blocked.
 * FOOD SAFETY OUTRANKS VALUE: produce reported "poor" is never routed to sale, storage or distribution.
 */
export type ReasonCode =
  | "listedForBuyers" | "deadlineIn" | "deadlinePassed" | "windowEnded" | "nothingAvailable" | "poorCondition"
  | "partlyReserved" | "tooSmallToSplit" | "hubFits" | "noCompatibleHub" | "storageNotGuarantee" | "processorDemo"
  | "inspectFirst" | "stillSellable" | "partnerDemo" | "conditionNotEnough" | "timeNotShort" | "tooLittleForPartner"
  | "foodSafetyFirst";

export type Reason = { code: ReasonCode; vars?: Record<string, string | number> };
export type Recommendation = {
  pathway: Pathway; eligible: boolean; score: number; reasons: Reason[]; blockers: Reason[];
  hubId?: string; estimatedCostInr?: number; isDemo: boolean;
};

const ORDER: Pathway[] = ["match_buyer", "split_batch", "temporary_storage", "food_processor", "recovery_partner"];
const r = (code: ReasonCode, vars?: Reason["vars"]): Reason => ({ code, vars });

export function recommend(input: { listing: ListingView; reservations: Reservation[]; hubs: HubView[]; now: Date }): Recommendation[] {
  const { listing, reservations, hubs, now } = input;
  const crop = CROP_PROFILES[listing.cropKey];
  const hoursLeft = (Date.parse(listing.recoverBy) - now.getTime()) / 3_600_000;
  const avail = listing.availableKg;
  const poor = listing.reportedCondition === "poor";
  const goodish = listing.reportedCondition === "fresh" || listing.reportedCondition === "good";
  const held = reservations.filter((x) => QUANTITY_HOLDING_RESERVATION.includes(x.status));

  const saleBlockers: Reason[] = [];
  if (poor) saleBlockers.push(r("poorCondition"));
  if (listing.status !== "active" || avail <= 0) saleBlockers.push(r("nothingAvailable"));
  if (hoursLeft <= 0) saleBlockers.push(r("deadlinePassed"));
  else if (Date.parse(listing.collectionUntil) <= now.getTime()) saleBlockers.push(r("windowEnded"));

  const out: Recommendation[] = [];
  const add = (x: Omit<Recommendation, "eligible"> & { eligible?: boolean }) =>
    out.push({ eligible: x.blockers.length === 0, ...x });

  // 1. Match another buyer
  add({
    pathway: "match_buyer", isDemo: false, blockers: saleBlockers, score: 60 + (hoursLeft < 24 ? 20 : 0) + (goodish ? 10 : 0),
    reasons: saleBlockers.length ? [] : [r("listedForBuyers", { kg: avail }), r("deadlineIn", { hours: Math.round(hoursLeft) })],
  });

  // 2. Split the batch
  const splitBlockers = [...saleBlockers];
  if (avail > 0 && avail < 20) splitBlockers.push(r("tooSmallToSplit", { a: avail }));
  add({
    pathway: "split_batch", isDemo: false, blockers: splitBlockers, score: 55 + (held.length ? 10 : 0) + (avail >= 50 ? 5 : 0),
    reasons: splitBlockers.length ? [] : held.length
      ? [r("partlyReserved", { n: held.length, kg: listing.reservedKg, a: avail })]
      : [r("listedForBuyers", { kg: avail })],
  });

  // 3. Temporary storage
  const storageBlockers: Reason[] = [];
  let best: HubView | undefined;
  if (poor) storageBlockers.push(r("poorCondition"));
  else if (listing.status !== "active" || avail <= 0) storageBlockers.push(r("nothingAvailable"));
  else {
    best = hubs
      .filter((h) => storageFit(h, listing.cropKey) === "ok" && h.availableKg >= avail)
      .sort((a, b) => Number(b.place.district === listing.place.district) - Number(a.place.district === listing.place.district)
        || a.costPerKgPerDay - b.costPerKgPerDay || a.id.localeCompare(b.id))[0];
    if (!best) storageBlockers.push(r("noCompatibleHub"));
  }
  const days = best ? (crop.perishability === "high" ? 1 : Math.min(2, maxDaysFor(best, listing.cropKey))) : 0;
  add({
    pathway: "temporary_storage", isDemo: true, blockers: storageBlockers, hubId: best?.id,
    estimatedCostInr: best ? Math.round(best.costPerKgPerDay * avail * days) : undefined,
    score: 50 + (best?.place.district === listing.place.district ? 15 : 0) + (hoursLeft >= 12 ? 10 : -10),
    reasons: best
      ? [r("hubFits", { name: best.name, days, cost: Math.round(best.costPerKgPerDay * avail * days) }),
         r("storageNotGuarantee", { days: maxDaysFor(best, listing.cropKey) })]
      : [],
  });

  // 4. Food processor (demonstration: no processors are listed)
  const procBlockers: Reason[] = [];
  if (listing.status !== "active" || avail <= 0) procBlockers.push(r("nothingAvailable"));
  else if (goodish && hoursLeft >= 12) procBlockers.push(r("stillSellable"));
  add({
    pathway: "food_processor", isDemo: true, blockers: procBlockers, score: 40 + (poor ? 30 : 0) + (hoursLeft < 12 ? 15 : 0),
    reasons: procBlockers.length ? [] : [r("processorDemo"), ...(poor ? [r("inspectFirst"), r("foodSafetyFirst")] : [])],
  });

  // 5. Approved recovery partner (demonstration: no verified partners are connected)
  const partnerBlockers: Reason[] = [];
  if (poor) partnerBlockers.push(r("poorCondition"));
  else if (!goodish) partnerBlockers.push(r("conditionNotEnough"));
  if (listing.status !== "active" || avail <= 0) partnerBlockers.push(r("nothingAvailable"));
  else if (avail < 10) partnerBlockers.push(r("tooLittleForPartner"));
  if (hoursLeft >= 24) partnerBlockers.push(r("timeNotShort"));
  add({
    pathway: "recovery_partner", isDemo: true, blockers: partnerBlockers, score: 35 + (hoursLeft < 12 ? 20 : 0),
    reasons: partnerBlockers.length ? [] : [r("partnerDemo"), r("foodSafetyFirst")],
  });

  return out.sort((a, b) => Number(b.eligible) - Number(a.eligible)
    || (a.eligible ? b.score - a.score : ORDER.indexOf(a.pathway) - ORDER.indexOf(b.pathway)));
}
