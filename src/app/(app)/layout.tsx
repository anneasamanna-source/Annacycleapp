import { DemoUserSwitcher } from "@/components/layout/DemoUserSwitcher";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { authMode, getViewer } from "@/lib/session";
import { getDict, getLocale } from "@/lib/i18n";
import { getRepositories } from "@/lib/repositories";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const demo = authMode() === "demo";
  const [locale, d, me, users] = await Promise.all([getLocale(), getDict(), getViewer(), demo ? getRepositories().users.listAll() : Promise.resolve([])]);

  return (
    <div className="min-h-dvh">
      <Sidebar labels={d.nav} tagline={d.brand.tagline} />
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <DemoBanner text={demo ? d.demo.banner : d.demo.localBanner}>
          {demo && me ? <div className="flex flex-wrap items-center gap-x-3">
            <DemoUserSwitcher users={users.map(({ id, name, role }) => ({ id, name, role }))} currentId={me.id} label={d.demoView.label} roleLabels={d.demoView.roles} />
            <span className="text-xs text-charcoal/75">{d.demoView.note}</span>
          </div> : null}
        </DemoBanner>
        <TopBar locale={locale} d={d} viewer={me} showAccount={!demo} />
        <main id="main" className="flex-1 px-4 py-8 pb-28 sm:px-8 lg:pb-10">
          {children}
        </main>
      </div>
      <MobileNav labels={d.nav} moreLabel={d.common.menu} />
    </div>
  );
}
