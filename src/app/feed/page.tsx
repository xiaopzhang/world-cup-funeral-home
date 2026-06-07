import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getActivityFeed } from "@/lib/repository";
import {
  absoluteUrl,
  pageMetadata,
  serializeJsonLd,
  siteName,
  websiteJsonLd,
} from "@/lib/seo";
import { LinkButton, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Latest Burials",
  description:
    "Browse the newest World Cup Funeral Home tombstones and pay respects to eliminated football teams.",
  path: "/feed",
});

export default async function FeedPage() {
  const activity = await getActivityFeed();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Latest Burials",
    url: absoluteUrl("/feed"),
    isPartOf: websiteJsonLd(),
    about: siteName,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <SiteHeader />
      <main>
        <Section className="py-12">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-5xl font-semibold">Funeral Notice Board</h1>
              <p className="mt-4 max-w-2xl text-[var(--muted)]">
                The latest tombstones only, so fans can find the best paperwork without wading through every candle.
              </p>
            </div>
            <LinkButton href="/create?team=italy">Build a Tombstone</LinkButton>
          </div>

          <div className="mt-10 space-y-3">
            {activity.length ? (
              activity.map((item) => (
                <article key={item.id} className="stone-panel rounded-md p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <p className="text-lg">{item.displayText}</p>
                    {item.tombstoneId && (
                      <LinkButton href={`/tombstone/${item.tombstoneId}`} variant="secondary">
                        Visit Tombstone
                      </LinkButton>
                    )}
                  </div>
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    {new Date(item.createdAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </article>
              ))
            ) : (
              <div className="stone-panel rounded-md p-10 text-center">
                <h2 className="text-2xl font-semibold">The notice board is empty.</h2>
                <p className="mt-3 text-[var(--muted)]">
                  Be the first fan to make Italy’s paperwork public.
                </p>
              </div>
            )}
          </div>
        </Section>
      </main>
    </>
  );
}
