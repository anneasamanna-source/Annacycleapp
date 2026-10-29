import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { HubCard } from "@/components/features/hubs/HubCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { CROP_KEYS, CROP_PROFILES } from "@/lib/domain/crop-profiles";
import { HUB_TYPES } from "@/lib/domain/enums";
import { getDict, getLocale } from "@/lib/i18n";
import { getRepositories } from "@/lib/repositories";
import { fill, formatNumber } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).hubs.title };
}

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function HubsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const [d, locale, sp] = await Promise.all([getDict(), getLocale(), searchParams]);
  const { hubs } = getRepositories();
  const cropKey = CROP_KEYS.find((k) => k === one(sp.crop));
  const type = HUB_TYPES.find((t) => t === one(sp.type));
  const district = one(sp.district)?.slice(0, 60) || undefined;
  const [rows, all] = await Promise.all([hubs.list({ cropKey, type, district }), hubs.list()]);
  const districts = [...new Set(all.map((h) => h.place.district))].sort();
  const h = d.hubs;
  const query = cropKey ? `?crop=${cropKey}` : "";

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{h.title}</h1>
      <p className="mt-2 max-w-2xl text-charcoal/75">{h.intro}</p>
      <form method="get" action="/hubs" role="search" className="mt-6 rounded-2xl border border-charcoal/10 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Select name="crop" label={h.crop} defaultValue={cropKey ?? ""}>
            <option value="">{h.allCrops}</option>
            {CROP_KEYS.map((k) => <option key={k} value={k}>{locale === "bn" ? CROP_PROFILES[k].nameBn : CROP_PROFILES[k].nameEn}</option>)}
          </Select>
          <Select name="type" label={h.type} defaultValue={type ?? ""}>
            <option value="">{d.market.all}</option>
            {HUB_TYPES.map((t) => <option key={t} value={t}>{h.types[t]}</option>)}
          </Select>
          <Select name="district" label={d.market.district} defaultValue={district ?? ""}>
            <option value="">{d.market.all}</option>
            {districts.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <ButtonLink href="/hubs" variant="ghost">{d.market.clear}</ButtonLink>
          <Button type="submit">{d.market.apply}</Button>
        </div>
      </form>
      <p role="status" className="mt-6 text-sm font-semibold text-charcoal/75">{fill(h.resultsCount, { n: formatNumber(rows.length, locale) })}</p>
      {rows.length === 0 ? (
        <div className="mt-4"><EmptyState icon={SearchX} title={h.emptyTitle} description={h.emptyBody} action={<ButtonLink href="/hubs" variant="secondary">{d.market.clear}</ButtonLink>} /></div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((x) => <HubCard key={x.id} hub={x} d={d} locale={locale} query={query} />)}
        </div>
      )}
    </div>
  );
}
