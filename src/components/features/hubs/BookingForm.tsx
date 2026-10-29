"use client";

import { useActionState } from "react";
import { requestBookingAction, type BookingState } from "@/app/(app)/hubs/[id]/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Dict, Locale } from "@/lib/i18n/config";
import { fill, formatNumber } from "@/lib/utils/format";

export function BookingForm({ hubId, batches, defaultBatch, t, locale }: {
  hubId: string; batches: { value: string; label: string }[]; defaultBatch?: string; t: Dict["hubs"]; locale: Locale;
}) {
  const [state, action, pending] = useActionState<BookingState, FormData>(requestBookingAction, {});
  const msg = state.error ? fill(t.errors[state.error], { a: formatNumber(state.limit ?? 0, locale) }) : undefined;
  const bad = (e: string[]) => (state.error && e.includes(state.error) ? msg : undefined);
  return (
    <form action={action} noValidate className="space-y-4">
      <input type="hidden" name="hubId" value={hubId} />
      <Select name="batch" label={t.batch} defaultValue={state.values?.batch ?? defaultBatch ?? ""} error={bad(["notYourBatch", "notVendor", "categoryNotAccepted", "storageIncompatible"])}>
        <option value="">{t.batchChoose}</option>
        {batches.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
      </Select>
      <Input name="quantity" label={t.quantity} inputMode="decimal" autoComplete="off" defaultValue={state.values?.quantity ?? ""} error={bad(["qtyInvalid", "qtyTooMuch", "noCapacity"])} />
      <Select name="days" label={t.days} hint={t.daysHint} defaultValue={state.values?.days ?? "1"} error={bad(["daysInvalid", "daysTooLong"])}>
        {[1, 2, 3].map((n) => <option key={n} value={n}>{formatNumber(n, locale)}</option>)}
      </Select>
      {state.error === "hubNotFound" ? <p role="alert" className="text-sm font-medium text-red-700">{msg}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? t.submitting : t.submit}</Button>
    </form>
  );
}
