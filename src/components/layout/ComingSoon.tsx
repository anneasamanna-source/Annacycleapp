import { Hammer } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDict } from "@/lib/i18n";

/** Honest placeholder for routes that a later stage builds. */
export async function ComingSoon({
  title,
  stage,
  body,
}: {
  title: string;
  stage: number;
  body?: string;
}) {
  const d = await getDict();
  const description = [body, `${d.placeholder.planned} ${stage}.`].filter(Boolean).join(" ");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{title}</h1>
      <div className="mt-6">
        <EmptyState
          icon={Hammer}
          title={d.placeholder.intro}
          description={description}
          action={
            <ButtonLink href="/" variant="secondary">
              {d.placeholder.back}
            </ButtonLink>
          }
        />
      </div>
    </div>
  );
}
