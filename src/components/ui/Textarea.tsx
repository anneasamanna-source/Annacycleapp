import { useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Textarea({
  label, hint, error, id, className, ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string }) {
  const auto = useId();
  const tid = id ?? auto;
  const describedBy = [hint ? `${tid}-hint` : null, error ? `${tid}-error` : null].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={tid} className="text-sm font-semibold text-charcoal">{label}</label>
      {hint ? <p id={`${tid}-hint`} className="text-sm text-charcoal/70">{hint}</p> : null}
      <textarea
        id={tid}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn("rounded-xl border bg-white px-4 py-3 text-base", error ? "border-red-700" : "border-charcoal/25", className)}
        {...rest}
      />
      {error ? <p id={`${tid}-error`} className="text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
