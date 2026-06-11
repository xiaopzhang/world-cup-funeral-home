import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dictionaries, isLocale, localizePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { CreatePageContent } from "../../create/page";

type LocalizedCreatePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalizedCreatePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale) || locale === "en") {
    return {};
  }

  const dictionary = dictionaries[locale];
  return pageMetadata({
    title: dictionary.create.title,
    description: dictionary.create.description,
    path: localizePath("/create", locale),
  });
}

export default async function LocalizedCreatePage({ params }: LocalizedCreatePageProps) {
  const { locale } = await params;

  if (!isLocale(locale) || locale === "en") {
    notFound();
  }

  return <CreatePageContent locale={locale} />;
}
