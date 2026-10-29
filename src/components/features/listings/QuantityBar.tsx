import type { Reservation } from "@/lib/domain/types";
import { QUANTITY_HOLDING_RESERVATION } from "@/lib/domain/enums";

const COLORS = ["bg-forest", "bg-leaf", "bg-harvest", "bg-charcoal"];

/** Reserved segments plus an open (hatched) remainder, so split batches are visible at a glance. */
export function QuantityBar({ totalKg, reservations, label }: { totalKg: number; reservations: Reservation[]; label: string }) {
  const held = reservations.filter((r) => QUANTITY_HOLDING_RESERVATION.includes(r.status));
  return (
    <div
      role="img"
      aria-label={label}
      className="flex h-4 gap-0.5 overflow-hidden rounded-full bg-[repeating-linear-gradient(45deg,transparent_0_6px,rgba(32,41,35,0.15)_6px_8px)]"
    >
      {held.map((r, i) => (
        <div key={r.id} className={COLORS[i % COLORS.length]} style={{ width: `${(r.quantityKg / totalKg) * 100}%` }} />
      ))}
    </div>
  );
}
