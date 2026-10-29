import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-charcoal/25 bg-white px-6 py-12 text-center">
      {Icon ? (
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-forest/5 text-forest">
          <Icon className="size-6" aria-hidden />
        </span>
      ) : null}
      <h2 className="text-lg font-bold text-forest">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-charcoal/75">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
