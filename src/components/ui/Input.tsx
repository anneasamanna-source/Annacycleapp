import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, id, className, ...rest }: Props) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-charcoal">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-charcoal/70">
          {hint}
        </p>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          "min-h-12 rounded-xl border bg-white px-4 text-base text-charcoal placeholder:text-charcoal/50",
          error ? "border-red-700" : "border-charcoal/25",
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
