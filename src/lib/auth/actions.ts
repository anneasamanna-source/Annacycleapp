"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRepositories } from "../repositories";
import { SESSION_COOKIE, authMode } from "../session";
import { validateLogin, validateRegister, type AuthErrors } from "../validation/auth";

export type AuthState = { errors: AuthErrors; values: Record<string, string> };

const strings = (fd: FormData) => {
  const v: Record<string, string> = {};
  for (const [k, x] of fd.entries()) if (typeof x === "string" && !k.startsWith("$")) v[k] = x;
  return v;
};

async function startSession(userId: string) {
  const { token, expiresAt } = await getRepositories().auth.createSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(expiresAt),
  });
}

export async function loginAction(_p: AuthState, fd: FormData): Promise<AuthState> {
  const values = strings(fd);
  delete values.password; // never send the password back to the page
  if (authMode() !== "local") return { errors: { form: "badLogin" }, values };
  const v = validateLogin(strings(fd));
  if (!v.ok) return { errors: v.errors, values };
  const res = await getRepositories().auth.verify(v.data.email, v.data.password);
  if (!res.ok) return { errors: { form: res.error }, values };
  await startSession(res.user.id);
  redirect("/dashboard");
}

export async function registerAction(_p: AuthState, fd: FormData): Promise<AuthState> {
  const values = strings(fd);
  delete values.password;
  if (authMode() !== "local") return { errors: { form: "badLogin" }, values };
  const v = validateRegister(strings(fd));
  if (!v.ok) return { errors: v.errors, values };
  const res = await getRepositories().auth.register(v.data);
  if (!res.ok) return { errors: { email: res.error }, values };
  await startSession(res.user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getRepositories().auth.deleteSession(token);
  jar.delete(SESSION_COOKIE);
  redirect("/");
}
