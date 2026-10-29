import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Select({
  label, hint, error, id, className, children, ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; error?: string }) {
  const auto = useId();
  const sid = id ?? auto;
  const describedBy = [hint ? `${sid}-hint` : null, error ? `${sid}-error` : null].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={sid} className="text-sm font-semibold text-charcoal">{label}</label>
      {hint ? <p id={`${sid}-hint`} className="text-sm text-charcoal/70">{hint}</p> : null}
      <select
        id={sid}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn("min-h-12 rounded-xl border bg-white px-3 text-base text-charcoal", error ? "border-red-700" : "border-charcoal/25", className)}
        {...rest}
      >
        {children}
      </select>
      {error ? <p id={`${sid}-error`} className="text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
