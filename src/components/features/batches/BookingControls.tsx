"use client";

import { useActionState } from "react";
import { bookingAction, type BookingActionState } from "@/app/(app)/batches/actions";
import { Button } from "@/components/ui/Button";
import { CONDITIONS, type BookingStatus } from "@/lib/domain/enums";
import type { Dict } from "@/lib/i18n/config";

/** Buttons depend on who is looking and the booking's status. The server re-checks every move. */
export function BookingControls({ bookingId, status, role, d }: { bookingId: string; status: BookingStatus; role: "operator" | "vendor"; d: Dict }) {
  const [state, action, pending] = useActionState<BookingActionState, FormData>(bookingAction, {});
  const t = d.batches;
  const choices: { to: string; label: string; variant?: "primary" | "secondary" | "ghost" }[] =
    role === "operator"
      ? status === "requested" ? [{ to: "accepted", label: t.accept, variant: "primary" }, { to: "declined", label: t.decline, variant: "ghost" }]
        : status === "accepted" ? [{ to: "checked_in", label: t.checkIn, variant: "primary" }]
        : status === "checked_in" ? [{ to: "record", label: t.record }, { to: "released", label: t.release, variant: "primary" }] : []
      : status === "requested" || status === "accepted" ? [{ to: "cancelled", label: t.cancel, variant: "ghost" }] : [];
  if (!choices.length) return null;
  const needsCheck = role === "operator" && (status === "accepted" || status === "checked_in");

  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      {needsCheck ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold">{t.condition}
            <select name="condition" defaultValue="good" className="min-h-11 rounded-xl border border-charcoal/25 bg-white px-3 font-normal">
              {CONDITIONS.map((c) => <option key={c} value={c}>{d.market.conditions[c]}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">{t.notes}
            <input name="notes" maxLength={200} className="min-h-11 rounded-xl border border-charcoal/25 bg-white px-3 font-normal" />
          </label>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => <Button key={c.to} type="submit" name="to" value={c.to} variant={c.variant ?? "secondary"} disabled={pending}>{c.label}</Button>)}
      </div>
      {state.error ? <p role="alert" className="text-sm font-medium text-red-700">{t.errors[state.error]}</p> : null}
    </form>
  );
}
