import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { pageMetadata } from "@/lib/seo";
import { CreateTombstoneFlow } from "./create-tombstone-flow";

export const metadata: Metadata = pageMetadata({
  title: "Build a Tombstone",
  description:
    "Create a shareable World Cup Funeral Home tombstone for Italy and future eliminated football teams.",
  path: "/create",
});

export default function CreatePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="stone-panel rounded-md p-8">Loading funeral paperwork...</div>}>
          <CreateTombstoneFlow />
        </Suspense>
      </main>
    </>
  );
}
