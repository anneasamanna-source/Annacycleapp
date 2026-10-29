import { PRODUCE_CATEGORIES } from "../domain/enums";
import type { ListingFilters, ListingSort } from "../repositories/interfaces";

const SORTS: ListingSort[] = ["newest", "deadline", "price_asc", "price_desc", "quantity_desc"];
type Raw = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Turns untrusted URL parameters into safe filters. Unknown values are ignored. */
export function parseMarketParams(sp: Raw): ListingFilters {
  const category = one(sp.category);
  const sort = one(sp.sort);
  return {
    q: one(sp.q)?.slice(0, 80) || undefined,
    category: PRODUCE_CATEGORIES.find((c) => c === category),
    district: one(sp.district)?.slice(0, 60) || undefined,
    onlyAvailable: one(sp.available) === "1",
    sort: SORTS.find((s) => s === sort) ?? "newest",
  };
}
