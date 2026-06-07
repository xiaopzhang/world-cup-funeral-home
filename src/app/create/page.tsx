import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { CreateTombstoneFlow } from "./create-tombstone-flow";

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
