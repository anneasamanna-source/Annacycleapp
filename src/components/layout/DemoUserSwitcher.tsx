"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setDemoUser } from "@/lib/demo-session-actions";
import { ROLES, type Role } from "@/lib/domain/enums";

type Option = { id: string; name: string; role: Role };

export function DemoUserSwitcher({ users, currentId, label, roleLabels }: {
  users: Option[]; currentId: string; label: string; roleLabels: Record<Role, string>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm font-semibold">
      <span>{label}</span>
      <select
        value={currentId}
        disabled={pending}
        onChange={(e) => start(async () => { await setDemoUser(e.target.value); router.refresh(); })}
        className="min-h-11 rounded-xl border border-charcoal/25 bg-white px-3 text-sm font-semibold text-charcoal"
      >
        {ROLES.map((role) => (
          <optgroup key={role} label={roleLabels[role]}>
            {users.filter((u) => u.role === role).map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
