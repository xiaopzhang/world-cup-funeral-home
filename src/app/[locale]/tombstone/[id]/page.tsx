import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dictionaries, isLocale, localizeTeam, localizeTombstone } from "@/lib/i18n";
import { getTombstoneDetails } from "@/lib/repository";
import { tombstoneMetadata } from "@/lib/seo";
import { TombstonePageContent } from "../../../tombstone/[id]/page";

type LocalizedTombstonePageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: LocalizedTombstonePageProps): Promise<Metadata> {
  const { locale, id } = await params;

  if (!isLocale(locale) || locale === "en") {
    return {};
  }

  const details = await getTombstoneDetails(id);
  const dictionary = dictionaries[locale];

  if (!details) {
    return {
      title: dictionary.detail.notFoundTitle,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const team = localizeTeam(details.team, locale);
  const tombstone = localizeTombstone(details.tombstone, locale);

  return tombstoneMetadata({
    id: tombstone.id,
    shareSlug: tombstone.shareSlug,
    teamName: team.name,
    causeOfDeath: tombstone.causeOfDeath,
    epitaph: tombstone.epitaph,
    flagUrl: team.flagUrl,
  });
}

export default async function LocalizedTombstonePage({ params }: LocalizedTombstonePageProps) {
  const { locale, id } = await params;

  if (!isLocale(locale) || locale === "en") {
    notFound();
  }

  return <TombstonePageContent id={id} locale={locale} />;
}
