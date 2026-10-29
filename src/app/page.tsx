import { Check, PackagePlus, Recycle, Split } from "lucide-react";
import Link from "next/link";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { Logo } from "@/components/layout/Logo";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { getDict, getLocale } from "@/lib/i18n";

// Sample quantities for the hero visual. The labels come from the dictionary.
const SAMPLE_TOTAL = 100;
const SAMPLE_KG = [40, 35, 25];
const SAMPLE_COLORS = ["bg-forest", "bg-leaf", "bg-harvest"];
const STEP_ICONS = [PackagePlus, Split, Recycle];

export default async function LandingPage() {
  const [locale, d] = await Promise.all([getLocale(), getDict()]);
  const l = d.landing;
  const num = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-IN");

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-forest focus:px-4 focus:py-3 focus:text-ivory"
      >
        {d.common.skipToContent}
      </a>

      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" aria-label="ANNA CYCLE">
          <Logo />
        </Link>
        <nav aria-label={d.nav.main} className="hidden items-center gap-8 text-sm font-semibold text-forest md:flex">
          <Link href="/marketplace" className="hover:underline">{d.nav.marketplace}</Link>
          <Link href="/hubs" className="hover:underline">{d.nav.hubs}</Link>
          <Link href="/impact" className="hover:underline">{d.nav.impact}</Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle locale={locale} label={d.common.language} />
          <ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">
            {d.common.signIn}
          </ButtonLink>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.15] tracking-tight text-forest sm:text-5xl">
              {l.heroTitle}
            </h1>
            <p className="mt-6 max-w-lg text-lg text-charcoal/80">{l.heroBody}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/marketplace" size="lg">{d.common.exploreDemo}</ButtonLink>
              <ButtonLink href="#how" size="lg" variant="secondary">{l.ctaSecondary}</ButtonLink>
            </div>
          </div>

          {/* The memorable element: one batch, split between buyers. */}
          <div className="rounded-3xl border border-charcoal/10 bg-white p-6 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-charcoal/70">{l.sample.label}</p>
                <p className="mt-1 text-3xl font-extrabold text-forest">
                  {l.sample.produce}, {num.format(SAMPLE_TOTAL)} {d.common.kg}
                </p>
              </div>
              <Badge tone="demo">{d.common.demoData}</Badge>
            </div>

            <div
              className="mt-6 flex h-4 gap-0.5 overflow-hidden rounded-full"
              role="img"
              aria-label={l.sample.rows
                .map((r, i) => `${r.name} ${num.format(SAMPLE_KG[i])} ${d.common.kg}, ${r.status}`)
                .join("; ")}
            >
              {SAMPLE_KG.map((kg, i) => (
                <div
                  key={i}
                  className={`bar-fill ${SAMPLE_COLORS[i]}`}
                  style={{ width: `${(kg / SAMPLE_TOTAL) * 100}%`, animationDelay: `${i * 140}ms` }}
                />
              ))}
            </div>

            <ul className="mt-6 divide-y divide-charcoal/10">
              {l.sample.rows.map((row, i) => (
                <li key={row.name} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex items-center gap-3 font-semibold">
                    <span className={`size-3 rounded-full ${SAMPLE_COLORS[i]}`} aria-hidden />
                    {row.name}
                  </span>
                  <span className="text-sm text-charcoal/75">
                    {num.format(SAMPLE_KG[i])} {d.common.kg} · {row.status}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-charcoal/70">{l.sample.note}</p>
          </div>
        </section>

        {/* How it works: a real sequence, so the steps are numbered. */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{l.howTitle}</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {l.steps.map((step, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <li key={step.title} className="relative border-t-2 border-forest pt-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-forest text-sm font-bold text-ivory">
                      {num.format(i + 1)}
                    </span>
                    <Icon className="size-6 text-forest" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-forest">{step.title}</h3>
                  <p className="mt-2 max-w-sm text-charcoal/80">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Recovery Engine: alternatives, not a sequence, so no numbering. */}
        <section className="border-y border-charcoal/10 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{l.pathwaysTitle}</h2>
              <p className="mt-4 max-w-md text-charcoal/80">{l.pathwaysBody}</p>
            </div>
            <ul className="divide-y divide-charcoal/10 border-y border-charcoal/10">
              {l.pathways.map((p) => (
                <li key={p.title} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <span className="font-bold text-forest">{p.title}</span>
                  <span className="text-charcoal/75 sm:max-w-xs sm:text-right">{p.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Hubs */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{l.hubsTitle}</h2>
          <p className="mt-4 max-w-xl text-charcoal/80">{l.hubsBody}</p>
          <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-charcoal/10">
            {l.hubTypes.map((hub, i) => (
              <div key={hub.name} className="md:px-8 md:first:pl-0 md:last:pr-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-forest">{hub.name}</h3>
                  {i === 1 ? <Badge tone="estimated">{l.concept}</Badge> : null}
                </div>
                <p className="mt-2 text-charcoal/80">{hub.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-2xl rounded-xl border border-harvest/60 bg-harvest/15 px-4 py-3 text-sm font-medium">
            {l.hubNote}
          </p>
          <ButtonLink href="/hubs" variant="secondary" className="mt-6">
            {d.nav.hubs}
          </ButtonLink>
        </section>

        {/* Honesty */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="rounded-3xl bg-forest px-6 py-10 text-ivory sm:px-12 sm:py-14">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{l.honestTitle}</h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {l.honestItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-1 size-5 shrink-0 text-leaf" aria-hidden />
                  <span className="text-ivory/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-charcoal/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-charcoal/70 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="font-bold tracking-[0.16em] text-forest">{d.brand.tagline}</p>
          <p className="max-w-xl">{l.footer}</p>
        </div>
      </footer>
    </>
  );
}
