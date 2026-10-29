import { UserX } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/features/auth/AuthForm";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDict } from "@/lib/i18n";
import { authMode, getViewer } from "@/lib/session";
import { DISTRICTS } from "@/lib/validation/listing";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).auth.register };
}

export default async function Page() {
  const d = await getDict();
  const t = d.auth;
  if (authMode() === "demo") {
    return <EmptyState icon={UserX} title={t.register} description={t.demoOff} action={<ButtonLink href="/marketplace" variant="secondary">{d.nav.marketplace}</ButtonLink>} />;
  }
  if (await getViewer()) redirect("/dashboard");
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{t.register}</h1>
      <div className="mt-6"><AuthForm mode="register" t={t} districts={DISTRICTS} /></div>
    </div>
  );
}
