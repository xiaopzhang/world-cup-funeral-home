import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { pageMetadata } from "@/lib/seo";
import { getCreateOptions } from "@/lib/repository";
import { dictionaries, localizeContentPack, localizeTeam, type Locale } from "@/lib/i18n";
import type { TeamContentPack } from "@/lib/types";
import { CreateTombstoneFlow } from "./create-tombstone-flow";

export const metadata: Metadata = pageMetadata({
  title: "Build a Tombstone",
  description:
    "Create a shareable World Cup Funeral Home tombstone for eliminated World Cup teams.",
  path: "/create",
});

export default async function CreatePage() {
  return <CreatePageContent locale="en" />;
}

export async function CreatePageContent({ locale }: { locale: Locale }) {
  const dictionary = dictionaries[locale];
  const createOptions = await getCreateOptions();
  const playableTeams = createOptions.teams.map((team) => localizeTeam(team, locale));
  const contentByTeam: Record<string, TeamContentPack> = Object.fromEntries(
    Object.entries(createOptions.content as Record<string, TeamContentPack>).map(([slug, pack]) => [
      slug,
      localizeContentPack(pack, locale),
    ]),
  );

  return (
    <>
      <SiteHeader locale={locale} dictionary={dictionary} />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="stone-panel rounded-md p-8">{dictionary.create.loading}</div>}>
          <CreateTombstoneFlow
            playableTeams={playableTeams}
            contentByTeam={contentByTeam}
            locale={locale}
            dictionary={dictionary}
          />
        </Suspense>
      </main>
    </>
  );
}
