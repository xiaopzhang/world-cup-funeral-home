import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getTombstoneDetails } from "@/lib/repository";
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
  const details = await getTombstoneDetails(id);

  if (!details) {
    notFound();
  }

  const jsonLd = tombstoneJsonLd({
    shareSlug: details.tombstone.shareSlug,
    teamName: details.team.name,
    causeOfDeath: details.tombstone.causeOfDeath,
    epitaph: details.tombstone.epitaph,
    buriedBy: details.tombstone.buriedBy,
    createdAt: details.tombstone.createdAt,
    flagUrl: details.team.flagUrl,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <SiteHeader />
      <TombstoneDetailClient id={id} initialDetails={details} />
    </>
  );
}
