import { cn } from "@/lib/utils/cn";

/** An open ring (a cycle that is still moving) around a harvest-orange seed. */
export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-forest", className)}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <circle
          cx="16"
          cy="16"
          r="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="56 19"
          transform="rotate(-70 16 16)"
        />
        <circle cx="16" cy="16" r="4.5" fill="#E99A45" />
      </svg>
      {showWordmark ? <span className="text-lg font-extrabold tracking-wide">ANNA CYCLE</span> : null}
    </span>
  );
}
