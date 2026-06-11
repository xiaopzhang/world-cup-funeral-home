import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { HomePage } from "../page";

type LocalizedPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedHomePage({ params }: LocalizedPageProps) {
  const { locale } = await params;

  if (!isLocale(locale) || locale === "en") {
    notFound();
  }

  return <HomePage locale={locale} />;
}
