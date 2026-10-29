import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDict } from "@/lib/i18n";

export default async function NotFound() {
  const d = await getDict();
  return (
    <div className="mx-auto max-w-xl">
      <EmptyState
        icon={SearchX}
        title={d.market.detail.notFoundTitle}
        description={d.market.detail.notFoundBody}
        action={<ButtonLink href="/marketplace" variant="secondary">{d.market.detail.back}</ButtonLink>}
      />
    </div>
  );
}
