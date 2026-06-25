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
import { dictionaries, localizeActivityItem, localizePath, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Latest Burials",
  description:
    "Browse the newest World Cup Funeral Home tombstones and pay respects to eliminated football teams.",
  path: "/feed",
});

export default async function FeedPage() {
  return <FeedPageContent locale="en" />;
}

export async function FeedPageContent({ locale }: { locale: Locale }) {
  const dictionary = dictionaries[locale];
  const activity = (await getActivityFeed()).map((item) => localizeActivityItem(item, locale));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: dictionary.feed.title,
    url: absoluteUrl(localizePath("/feed", locale)),
    isPartOf: websiteJsonLd(),
    about: siteName,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <SiteHeader locale={locale} dictionary={dictionary} />
      <main>
        <Section className="py-12">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-5xl font-semibold">{dictionary.feed.boardTitle}</h1>
              <p className="mt-4 max-w-2xl text-[var(--muted)]">
                {dictionary.feed.boardBody}
              </p>
            </div>
            <LinkButton href={localizePath("/create", locale)}>{dictionary.common.buildTombstone}</LinkButton>
          </div>

          <div className="mt-10 space-y-3">
            {activity.length ? (
              activity.map((item) => (
                <article key={item.id} className="stone-panel rounded-md p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <p className="text-lg">{item.displayText}</p>
                    {item.tombstoneId && (
                      <LinkButton href={localizePath(`/tombstone/${item.tombstoneId}`, locale)} variant="secondary">
                        {dictionary.common.visitTombstone}
                      </LinkButton>
                    )}
                  </div>
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    {new Date(item.createdAt).toLocaleString(locale === "zh" ? "zh-CN" : locale, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </article>
              ))
            ) : (
              <div className="stone-panel rounded-md p-10 text-center">
                <h2 className="text-2xl font-semibold">{dictionary.feed.emptyTitle}</h2>
                <p className="mt-3 text-[var(--muted)]">
                  {dictionary.feed.emptyBody}
                </p>
              </div>
            )}
          </div>
        </Section>
      </main>
    </>
  );
}
