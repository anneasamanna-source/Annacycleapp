"use client";

import { useActionState } from "react";
import { reserveAction, type ReserveState } from "@/app/(app)/marketplace/[id]/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Dict, Locale } from "@/lib/i18n/config";
import { fill, formatNumber } from "@/lib/utils/format";

export function ReserveForm({ listingId, availableKg, t, locale }: { listingId: string; availableKg: number; t: Dict["reserve"]; locale: Locale }) {
  const [state, action, pending] = useActionState<ReserveState, FormData>(reserveAction, {});
  const a = formatNumber(state.availableKg ?? availableKg, locale);
  const error = state.error ? fill(t.errors[state.error], { a }) : undefined;

  return (
    <form action={action} noValidate className="space-y-4">
      <input type="hidden" name="listingId" value={listingId} />
      <Input
        name="quantity"
        label={t.quantity}
        hint={fill(t.buyerHint, { a: formatNumber(availableKg, locale) })}
        inputMode="decimal"
        autoComplete="off"
        defaultValue={state.values?.quantity ?? ""}
        error={error}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="mode" value="qty" disabled={pending}>{pending ? t.submitting : t.submit}</Button>
        <Button type="submit" name="mode" value="all" variant="secondary" disabled={pending}>
          {fill(t.all, { a: formatNumber(availableKg, locale) })}
        </Button>
      </div>
    </form>
  );
}
