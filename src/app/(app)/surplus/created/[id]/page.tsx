import { CheckCircle2, Info, Warehouse } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCropProfile } from "@/lib/domain/crop-profiles";
import { getDict, getLocale } from "@/lib/i18n";
import { getRepositories } from "@/lib/repositories";
import { authMode } from "@/lib/session";
import { fill, formatDateTime, formatNumber, formatPrice } from "@/lib/utils/format";

export default async function CreatedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [d, locale] = await Promise.all([getDict(), getLocale()]);
  const l = await getRepositories().listings.getById(id);
  if (!l) notFound();
  const t = d.surplus.done;
  const name = locale === "bn" ? getCropProfile(l.cropKey).nameBn : l.produceName;
  const rows: [string, string][] = [
    [t.batch, l.batchCode],
    [t.quantity, `${formatNumber(l.totalKg, locale)} ${d.common.kg}`],
    [t.price, `${formatPrice(l.askingPricePerKg, locale)} ${d.market.card.perKg}`],
    [t.recoverBy, formatDateTime(l.recoverBy, locale)],
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-9 text-forest" aria-hidden />
        <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{t.title}</h1>
      </div>
      <p className="mt-3 text-lg">{fill(t.intro, { code: l.batchCode })}</p>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-extrabold text-forest">{name}</h2>
          {l.isDemo ? <Badge tone="demo">{d.common.demoData}</Badge> : null}
        </div>
        <dl className="mt-4 divide-y divide-charcoal/10">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className="text-sm font-semibold text-charcoal/70">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {l.reportedCondition === "poor" ? (
        <p role="note" className="mt-4 rounded-xl border border-red-800/40 bg-red-50 p-4 text-sm text-red-900">{t.poorNote}</p>
      ) : null}
      <p className="mt-4 flex gap-2 text-sm text-charcoal/70"><Info className="mt-0.5 size-4 shrink-0" aria-hidden />{authMode() === "demo" ? t.demoNote : ""}</p>

      <h2 className="mt-8 text-lg font-bold text-forest">{t.next}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-charcoal/85">
        <li>{t.n1}</li><li>{t.n2}</li><li>{t.n3}</li>
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={`/marketplace/${l.id}`} size="lg">{t.view}</ButtonLink>
        <ButtonLink href={`/hubs?crop=${l.cropKey}`} size="lg" variant="secondary"><Warehouse className="size-4" aria-hidden />{t.storage}</ButtonLink>
        <ButtonLink href="/surplus/new" size="lg" variant="ghost">{t.another}</ButtonLink>
      </div>
    </div>
  );
}
