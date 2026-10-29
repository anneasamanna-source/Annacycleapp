import { Info, Recycle } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { getCropProfile } from "@/lib/domain/crop-profiles";
import { getDict, getLocale } from "@/lib/i18n";
import { getRepositories } from "@/lib/repositories";
import { recommend, type Reason } from "@/lib/services/recovery-engine";
import { fill, formatNumber, formatPrice } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).recovery.title };
}

export default async function RecoveryPage({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const [d, locale, sp] = await Promise.all([getDict(), getLocale(), searchParams]);
  const repos = getRepositories();
  const t = d.recovery;
  const active = (await repos.listings.list({ sort: "deadline" })).filter((l) => l.status === "active");
  const chosen = active.find((l) => l.id === sp.listing) ?? active[0];
  const nm = (l: { cropKey: Parameters<typeof getCropProfile>[0]; produceName: string }) => (locale === "bn" ? getCropProfile(l.cropKey).nameBn : l.produceName);
  const say = (x: Reason) => fill(t.reasons[x.code], Object.fromEntries(Object.entries(x.vars ?? {}).map(([k, v]) => [k, typeof v === "number" ? formatNumber(v, locale) : v])));

  const recs = chosen
    ? recommend({ listing: chosen, reservations: await repos.reservations.listForListing(chosen.id), hubs: await repos.hubs.list(), now: new Date() })
    : [];
  const suggested = recs.filter((r) => r.eligible);
  const blocked = recs.filter((r) => !r.eligible);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{t.title}</h1>
      <p className="mt-2 text-charcoal/75">{t.intro}</p>
      <p className="mt-3 flex gap-2 rounded-xl bg-harvest/15 p-3 text-sm font-medium"><Info className="mt-0.5 size-4 shrink-0" aria-hidden />{t.safety}</p>

      {!chosen ? (
        <div className="mt-6"><EmptyState icon={Recycle} title={t.none} /></div>
      ) : (
        <>
          <form method="get" action="/recovery" className="mt-6 flex flex-wrap items-end gap-3">
            <div className="min-w-60 flex-1">
              <Select name="listing" label={t.batch} defaultValue={chosen.id}>
                {active.map((l) => <option key={l.id} value={l.id}>{l.batchCode} · {nm(l)} · {formatNumber(l.availableKg, locale)} {d.common.kg}</option>)}
              </Select>
            </div>
            <Button type="submit">{t.show}</Button>
          </form>

          <h2 className="mt-8 text-lg font-bold text-forest">{t.recommended}</h2>
          {suggested.length === 0 ? <p className="mt-2 text-sm text-charcoal/75">{t.blocked}</p> : (
            <ol className="mt-3 space-y-4">
              {suggested.map((r) => (
                <li key={r.pathway}>
                  <Card>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-extrabold text-forest">{t.pathways[r.pathway]}</h3>
                      {r.isDemo ? <Badge tone="demo">{t.demo}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-charcoal/70">{t.why}</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{r.reasons.map((x, i) => <li key={i}>{say(x)}</li>)}</ul>
                    {r.estimatedCostInr !== undefined ? <p className="mt-2 text-sm"><span className="font-semibold">{t.cost}:</span> {formatPrice(r.estimatedCostInr, locale)}</p> : null}
                    <div className="mt-3">
                      {r.pathway === "temporary_storage" && r.hubId ? <ButtonLink href={`/hubs/${r.hubId}?listing=${chosen.id}`} variant="secondary">{t.viewHub}</ButtonLink>
                        : r.pathway === "match_buyer" || r.pathway === "split_batch" ? <ButtonLink href={`/marketplace/${chosen.id}`} variant="secondary">{t.openListing}</ButtonLink> : null}
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          )}

          <h2 className="mt-8 text-lg font-bold text-forest">{t.blocked}</h2>
          <ul className="mt-3 space-y-3">
            {blocked.map((r) => (
              <li key={r.pathway} className="rounded-xl border border-charcoal/10 bg-white/60 p-4">
                <p className="font-bold text-charcoal/80">{t.pathways[r.pathway]}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-charcoal/75">{r.blockers.map((x, i) => <li key={i}>{say(x)}</li>)}</ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
