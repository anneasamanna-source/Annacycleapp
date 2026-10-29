"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type AuthState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Dict } from "@/lib/i18n/config";
import type { AuthField } from "@/lib/validation/auth";

export function AuthForm({ mode, t, districts }: { mode: "login" | "register"; t: Dict["auth"]; districts: readonly string[] }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? loginAction : registerAction, { errors: {}, values: {} });
  const err = (f: AuthField) => (state.errors[f] ? t.errors[state.errors[f]!] : undefined);
  const reg = mode === "register";
  return (
    <form action={action} noValidate className="space-y-5">
      {state.errors.form ? <p role="alert" className="rounded-xl border-2 border-red-700 bg-red-50 p-3 font-semibold text-red-900">{t.errors[state.errors.form]}</p> : null}
      {reg ? <Input name="name" label={t.fields.name} autoComplete="name" defaultValue={state.values.name} error={err("name")} /> : null}
      <Input name="email" type="email" label={t.fields.email} autoComplete="email" inputMode="email" defaultValue={state.values.email} error={err("email")} />
      <Input name="password" type="password" label={t.fields.password} hint={reg ? t.fields.passwordHint : undefined} autoComplete={reg ? "new-password" : "current-password"} error={err("password")} />
      {reg ? (
        <>
          <fieldset aria-invalid={err("role") ? true : undefined}>
            <legend className="text-sm font-semibold">{t.fields.role}</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {(["vendor", "buyer"] as const).map((r) => (
                <label key={r} className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-charcoal/25 bg-white px-3 text-center text-sm font-semibold has-[:checked]:border-forest has-[:checked]:bg-forest has-[:checked]:text-ivory">
                  <input type="radio" name="role" value={r} defaultChecked={state.values.role === r} className="sr-only" />{t.roles[r]}
                </label>
              ))}
            </div>
            {err("role") ? <p className="mt-2 text-sm font-medium text-red-700">{err("role")}</p> : null}
          </fieldset>
          <Select name="district" label={t.fields.district} defaultValue={state.values.district ?? ""} error={err("district")}>
            <option value="">—</option>
            {districts.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
          <p className="text-sm text-charcoal/70">{t.operatorNote}</p>
        </>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="w-full">{pending ? t.working : reg ? t.submitRegister : t.submitLogin}</Button>
      <p className="text-center text-sm">
        {reg ? t.haveAccount : t.noAccount}{" "}
        <Link href={reg ? "/login" : "/register"} className="font-bold text-forest underline">{reg ? t.login : t.register}</Link>
      </p>
    </form>
  );
}
