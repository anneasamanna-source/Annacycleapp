import type { Metadata } from "next";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { Card } from "@/components/ui/Card";
import { authMode, requireViewer } from "@/lib/session";
import { getDict, getLocale } from "@/lib/i18n";
import { fill } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).settings.title };
}

export default async function SettingsPage() {
  const [d, locale, me] = await Promise.all([getDict(), getLocale(), requireViewer()]);
  const t = d.settings;
  const demo = authMode() === "demo";
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{t.title}</h1>
      <Card><h2 className="text-lg font-bold text-forest">{t.language}</h2><p className="mt-1 text-sm text-charcoal/75">{t.languageHelp}</p>
        <div className="mt-3"><LanguageToggle locale={locale} label={d.common.language} /></div></Card>
      <Card><h2 className="text-lg font-bold text-forest">{demo ? t.demoUser : t.account}</h2>
        <p className="mt-1 text-sm text-charcoal/75">{fill(demo ? t.demoUserHelp : t.accountHelp, { name: me.name, role: d.demoView.roles[me.role] })}</p></Card>
      <Card><h2 className="text-lg font-bold text-forest">{t.data}</h2><p className="mt-1 text-sm text-charcoal/75">{demo ? t.dataDemo : t.dataLocal}</p></Card>
      <Card><h2 className="text-lg font-bold text-forest">{t.about}</h2><p className="mt-1 text-sm text-charcoal/75">{t.aboutBody}</p></Card>
    </div>
  );
}
