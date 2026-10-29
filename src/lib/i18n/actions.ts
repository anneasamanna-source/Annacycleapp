"use server";

import { cookies } from "next/headers";
import { COOKIE_NAME, isLocale } from "./config";

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
