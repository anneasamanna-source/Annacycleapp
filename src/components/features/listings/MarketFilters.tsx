import { Search } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PRODUCE_CATEGORIES } from "@/lib/domain/enums";
import type { Dict } from "@/lib/i18n/config";
import type { ListingFilters, ListingSort } from "@/lib/repositories/interfaces";

const SORTS: ListingSort[] = ["newest", "deadline", "price_asc", "price_desc", "quantity_desc"];

/** A plain GET form: works without JavaScript and keeps filters in the URL. */
export function MarketFilters({ d, districts, values }: { d: Dict; districts: string[]; values: ListingFilters }) {
  const m = d.market;
  return (
    <form method="get" action="/marketplace" role="search" className="rounded-2xl border border-charcoal/10 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input name="q" type="search" label={m.search} placeholder={m.searchPlaceholder} defaultValue={values.q} />
        <Select name="category" label={m.category} defaultValue={values.category ?? ""}>
          <option value="">{m.all}</option>
          {PRODUCE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{m.categories[c]}</option>
          ))}
        </Select>
        <Select name="district" label={m.district} defaultValue={values.district ?? ""}>
          <option value="">{m.all}</option>
          {districts.map((x) => (
            <option key={x} value={x}>{x}</option>
          ))}
        </Select>
        <Select name="sort" label={m.sort} defaultValue={values.sort ?? "newest"}>
          {SORTS.map((s) => (
            <option key={s} value={s}>{m.sorts[s]}</option>
          ))}
        </Select>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="available" value="1" defaultChecked={values.onlyAvailable} className="size-5 accent-forest" />
          {m.onlyAvailable}
        </label>
        <div className="flex gap-2">
          <ButtonLink href="/marketplace" variant="ghost">{m.clear}</ButtonLink>
          <Button type="submit">
            <Search className="size-4" aria-hidden />
            {m.apply}
          </Button>
        </div>
      </div>
    </form>
  );
}
