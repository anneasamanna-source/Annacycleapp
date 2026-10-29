import { CURRENCY } from "../domain/enums";
import type { Locale } from "../i18n/config";

export const intlLocale = (l: Locale) => (l === "bn" ? "bn-IN" : "en-IN");
const TZ = "Asia/Kolkata";

export const formatNumber = (n: number, l: Locale) =>
  new Intl.NumberFormat(intlLocale(l), { maximumFractionDigits: 2 }).format(n);

export const formatPrice = (n: number, l: Locale) =>
  new Intl.NumberFormat(intlLocale(l), { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 }).format(n);

export const hoursUntil = (iso: string, now = Date.now()) => (new Date(iso).getTime() - now) / 3_600_000;

export function relativeTime(iso: string, l: Locale, now = Date.now()): string {
  const h = hoursUntil(iso, now);
  const rtf = new Intl.RelativeTimeFormat(intlLocale(l), { numeric: "auto" });
  if (Math.abs(h) < 1) return rtf.format(Math.round(h * 60), "minute");
  if (Math.abs(h) < 48) return rtf.format(Math.round(h), "hour");
  return rtf.format(Math.round(h / 24), "day");
}

export const formatDateTime = (iso: string, l: Locale) =>
  new Intl.DateTimeFormat(intlLocale(l), {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));

/** Fills {name} placeholders in dictionary strings. */
export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
