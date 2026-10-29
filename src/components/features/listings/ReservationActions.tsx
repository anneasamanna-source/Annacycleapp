"use client";

import { useActionState } from "react";
import { transitionAction, type TransitionState } from "@/app/(app)/marketplace/[id]/actions";
import { Button } from "@/components/ui/Button";
import type { ReservationStatus } from "@/lib/domain/enums";
import type { Dict } from "@/lib/i18n/config";

export type ActionChoice = { to: ReservationStatus; label: string; variant?: "primary" | "secondary" | "ghost" };

export function ReservationActions({ reservationId, listingId, choices, errors }: {
  reservationId: string; listingId: string; choices: ActionChoice[]; errors: Dict["reserve"]["errors"];
}) {
  const [state, action, pending] = useActionState<TransitionState, FormData>(transitionAction, {});
  return (
    <form action={action} className="mt-2">
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="listingId" value={listingId} />
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => (
          <Button key={c.to} type="submit" name="to" value={c.to} variant={c.variant ?? "secondary"} disabled={pending}>
            {c.label}
          </Button>
        ))}
      </div>
      {state.error ? <p role="alert" className="mt-2 text-sm font-medium text-red-700">{errors[state.error]}</p> : null}
    </form>
  );
}
