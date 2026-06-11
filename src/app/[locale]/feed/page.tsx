import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dictionaries, isLocale, localizePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { FeedPageContent } from "../../feed/page";

type LocalizedFeedPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalizedFeedPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale) || locale === "en") {
    return {};
  }

  const dictionary = dictionaries[locale];
  return pageMetadata({
    title: dictionary.feed.title,
    description: dictionary.feed.description,
    path: localizePath("/feed", locale),
  });
}

export default async function LocalizedFeedPage({ params }: LocalizedFeedPageProps) {
  const { locale } = await params;

  if (!isLocale(locale) || locale === "en") {
    notFound();
  }

  return <FeedPageContent locale={locale} />;
}
