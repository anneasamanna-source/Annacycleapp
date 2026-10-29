import { Info } from "lucide-react";
import type { ReactNode } from "react";

export function DemoBanner({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-harvest/50 bg-harvest/20 px-4 py-2 text-sm text-charcoal sm:px-8">
      <p className="flex items-start gap-2">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {text}
      </p>
      {children}
    </div>
  );
}
