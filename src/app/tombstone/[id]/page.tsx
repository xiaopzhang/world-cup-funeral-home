import { SiteHeader } from "@/components/site-header";
import { TombstoneDetailClient } from "./tombstone-detail-client";

export default async function TombstonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <SiteHeader />
      <TombstoneDetailClient id={id} />
    </>
  );
}
