import { LogOut } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { User } from "@/lib/domain/types";
import type { Dict } from "@/lib/i18n/config";
import { logoutAction } from "@/lib/auth/actions";

export function AccountControl({ viewer, d }: { viewer: User | null; d: Dict }) {
  if (!viewer) return <ButtonLink href="/login" variant="secondary">{d.common.signIn}</ButtonLink>;
  return (
    <form action={logoutAction} className="flex items-center gap-2">
      <span className="hidden text-sm font-semibold sm:inline">{viewer.name}</span>
      <Button type="submit" variant="secondary">
        <LogOut className="size-4" aria-hidden />
        <span className="sr-only sm:not-sr-only">{d.auth.signOut}</span>
      </Button>
    </form>
  );
}
