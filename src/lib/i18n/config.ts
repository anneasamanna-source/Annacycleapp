import type en from "./en.json";

export const LOCALES = ["en", "bn"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const COOKIE_NAME = "anna_locale";

/** Every language file must have exactly the shape of en.json. */
export type Dict = typeof en;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
