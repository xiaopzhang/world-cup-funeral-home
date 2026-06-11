import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getTombstoneDetails } from "@/lib/repository";
import { dictionaries, localizeMatch, localizeTeam, localizeTombstone, type Locale } from "@/lib/i18n";
import {
  serializeJsonLd,
  tombstoneJsonLd,
  tombstoneMetadata,
} from "@/lib/seo";
import { TombstoneDetailClient } from "./tombstone-detail-client";

type TombstonePageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: TombstonePageProps): Promise<Metadata> {
  const { id } = await params;
  const details = await getTombstoneDetails(id);

  if (!details) {
    return {
      title: "Tombstone Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return tombstoneMetadata({
    id: details.tombstone.id,
    shareSlug: details.tombstone.shareSlug,
    teamName: details.team.name,
    causeOfDeath: details.tombstone.causeOfDeath,
    epitaph: details.tombstone.epitaph,
    flagUrl: details.team.flagUrl,
  });
}

export default async function TombstonePage({
  params,
}: TombstonePageProps) {
  const { id } = await params;
  return <TombstonePageContent id={id} locale="en" />;
}

export async function TombstonePageContent({
  id,
  locale,
}: {
  id: string;
  locale: Locale;
}) {
  const dictionary = dictionaries[locale];
  const details = await getTombstoneDetails(id);

  if (!details) {
    notFound();
  }

  const localizedDetails = {
    ...details,
    team: localizeTeam(details.team, locale),
    deathMatch: localizeMatch(details.deathMatch, locale),
    tombstone: localizeTombstone(details.tombstone, locale),
  };

  const jsonLd = tombstoneJsonLd({
    shareSlug: localizedDetails.tombstone.shareSlug,
    teamName: localizedDetails.team.name,
    causeOfDeath: localizedDetails.tombstone.causeOfDeath,
    epitaph: localizedDetails.tombstone.epitaph,
    buriedBy: localizedDetails.tombstone.buriedBy,
    createdAt: localizedDetails.tombstone.createdAt,
    flagUrl: localizedDetails.team.flagUrl,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <SiteHeader locale={locale} dictionary={dictionary} />
      <TombstoneDetailClient id={id} initialDetails={localizedDetails} locale={locale} dictionary={dictionary} />
    </>
  );
}
