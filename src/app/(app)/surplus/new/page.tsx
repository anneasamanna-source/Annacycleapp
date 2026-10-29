import type { Metadata } from "next";
import { ListingForm } from "@/components/features/listings/ListingForm";
import { Badge } from "@/components/ui/Badge";
import { CROP_KEYS, CROP_PROFILES } from "@/lib/domain/crop-profiles";
import { getDict, getLocale } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { authMode, getListingSeller, getViewer } from "@/lib/session";
import { fill } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).surplus.title };
}

export default async function NewSurplusPage() {
  const [d, locale] = await Promise.all([getDict(), getLocale()]);
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const vendor = await getListingSeller();
  const crops = CROP_KEYS.map((k) => ({
    value: k,
    label: locale === "bn" ? `${CROP_PROFILES[k].nameBn} (${CROP_PROFILES[k].nameEn})` : CROP_PROFILES[k].nameEn,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{d.surplus.title}</h1>
      <p className="mt-2 text-charcoal/75">{d.surplus.intro}</p>
      {!vendor ? (
        <p className="mt-6 rounded-xl border border-red-800/40 bg-red-50 p-4 text-red-900">{d.surplus.vendorOnly}</p>
      ) : (
        <>
          {authMode() === "demo" ? (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <Badge tone="demo">{d.common.demoData}</Badge>
              {fill(d.surplus.demoSeller, { name: vendor.name })}
            </p>
          ) : null}
          <div className="mt-6">
            <ListingForm t={d.surplus} conditions={d.market.conditions} crops={crops} />
          </div>
        </>
      )}
    </div>
  );
}
