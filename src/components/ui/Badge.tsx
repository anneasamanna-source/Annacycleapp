import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Tones carry meaning, not decoration:
 * verified = confirmed outcome, estimated = calculated guess,
 * demo = sample data, neutral = everything else.
 */
type Tone = "neutral" | "verified" | "estimated" | "demo" | "ok" | "caution";

const tones: Record<Tone, string> = {
  neutral: "bg-charcoal/5 text-charcoal",
  verified: "bg-forest text-ivory",
  estimated: "border border-harvest bg-harvest/20 text-charcoal",
  ok: "bg-forest/10 text-forest",
  caution: "border border-red-800/40 bg-red-50 text-red-900",
  demo: "border border-dashed border-charcoal/40 bg-white text-charcoal/80",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
