import { cookies } from "next/headers";
import en from "./en.json";
import bn from "./bn.json";
import { COOKIE_NAME, DEFAULT_LOCALE, isLocale, type Dict, type Locale } from "./config";

// If bn.json is missing or has an extra key, TypeScript reports it here.
const dictionaries: Record<Locale, Dict> = { en, bn };

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDict(): Promise<Dict> {
  return dictionaries[await getLocale()];
}
