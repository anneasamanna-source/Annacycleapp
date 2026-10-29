import { DISTRICTS } from "./listing";

export type AuthErrorKey =
  | "required" | "emailInvalid" | "passwordShort" | "passwordLong" | "nameLong"
  | "roleInvalid" | "districtInvalid" | "emailTaken" | "badLogin" | "tooMany";
export type AuthField = "name" | "email" | "password" | "role" | "district";
export type AuthErrors = Partial<Record<AuthField | "form", AuthErrorKey>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailAndPassword(raw: Record<string, string | undefined>, errors: AuthErrors, checkLength: boolean) {
  const email = (raw.email ?? "").trim().toLowerCase();
  const password = raw.password ?? "";
  if (!email) errors.email = "required";
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = "emailInvalid";
  if (!password) errors.password = "required";
  else if (password.length > 128) errors.password = "passwordLong";
  else if (checkLength && password.length < 8) errors.password = "passwordShort";
  return { email, password };
}

export function validateLogin(raw: Record<string, string | undefined>) {
  const errors: AuthErrors = {};
  const { email, password } = emailAndPassword(raw, errors, false);
  return Object.keys(errors).length ? ({ ok: false, errors } as const) : ({ ok: true, data: { email, password } } as const);
}

export function validateRegister(raw: Record<string, string | undefined>) {
  const errors: AuthErrors = {};
  const { email, password } = emailAndPassword(raw, errors, true);
  const name = (raw.name ?? "").trim();
  if (!name) errors.name = "required";
  else if (name.length > 80) errors.name = "nameLong";
  // Only vendor and buyer can be chosen here. Operators and admins are never self-service.
  const role = raw.role === "vendor" || raw.role === "buyer" ? raw.role : undefined;
  if (!role) errors.role = "roleInvalid";
  const district = raw.district ?? "";
  if (!(DISTRICTS as readonly string[]).includes(district)) errors.district = "districtInvalid";
  return Object.keys(errors).length
    ? ({ ok: false, errors } as const)
    : ({ ok: true, data: { name, email, password, role: role!, district } } as const);
}
