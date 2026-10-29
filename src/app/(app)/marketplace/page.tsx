import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { ListingCard } from "@/components/features/listings/ListingCard";
import { MarketFilters } from "@/components/features/listings/MarketFilters";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDict, getLocale } from "@/lib/i18n";
import { getRepositories } from "@/lib/repositories";
import { parseMarketParams } from "@/lib/services/market-params";
import { fill, formatNumber } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).market.title };
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [d, locale, sp] = await Promise.all([getDict(), getLocale(), searchParams]);
  const { listings } = getRepositories();
  const filters = parseMarketParams(sp);
  const [rows, all] = await Promise.all([listings.list(filters), listings.list()]);
  const districts = [...new Set(all.map((l) => l.place.district))].sort();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{d.market.title}</h1>
      <p className="mt-2 max-w-2xl text-charcoal/75">{d.market.intro}</p>

      <div className="mt-6">
        <MarketFilters d={d} districts={districts} values={filters} />
      </div>

      <p className="mt-6 text-sm font-semibold text-charcoal/75" role="status">
        {rows.length === 1 ? d.market.resultsOne : fill(d.market.resultsCount, { n: formatNumber(rows.length, locale) })}
      </p>

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={SearchX}
            title={d.market.emptyTitle}
            description={d.market.emptyBody}
            action={<ButtonLink href="/marketplace" variant="secondary">{d.market.clear}</ButtonLink>}
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((l) => (
            <ListingCard key={l.id} l={l} locale={locale} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}
