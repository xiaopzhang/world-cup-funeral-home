import { Activity, Flower2, Flame, ScrollText } from "lucide-react";
import { getHomeSnapshot } from "@/lib/repository";
import { teams as seededTeams } from "@/lib/seed-data";
import { SiteHeader } from "@/components/site-header";
import { TeamCard } from "@/components/team-card";
import { TombstoneCard } from "@/components/tombstone-card";
import { LinkButton, Section, Stat } from "@/components/ui";
import { dictionaries, localizePath, localizeTeam, localizeTombstone, type Locale } from "@/lib/i18n";
import { serializeJsonLd, websiteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <HomePage locale="en" />;
}

export async function HomePage({ locale }: { locale: Locale }) {
  const dictionary = dictionaries[locale];
  const snapshot = await getHomeSnapshot();
  const teams = snapshot.teams.map((team) => localizeTeam(team, locale));
  const italy = teams.find((team) => team.slug === "italy")!;
  const latest = snapshot.latestTombstones.map((tombstone) => localizeTombstone(tombstone, locale));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      websiteJsonLd(),
      {
        "@type": "WebPage",
        name: dictionary.common.siteName,
        description: dictionary.home.description,
        isPartOf: websiteJsonLd(),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <SiteHeader locale={locale} dictionary={dictionary} />
      <main>
        <Section className="grid min-h-[calc(100vh-65px)] items-center gap-10 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
          <div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.94] tracking-normal text-[var(--foreground)] sm:text-7xl lg:text-8xl">
              {dictionary.common.siteName}
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-8 text-[var(--muted)]">
              {dictionary.home.heroBody}
            </p>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#d8ccb6]">
              {dictionary.home.heroNote}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <LinkButton href={localizePath("/create?team=italy", locale)}>{dictionary.common.buildTombstone}</LinkButton>
              <LinkButton href={localizePath("/feed", locale)} variant="secondary">
                {dictionary.home.viewLatest}
              </LinkButton>
            </div>
          </div>

          <div className="stone-panel relative overflow-hidden rounded-md p-5 sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--green)] via-white to-[var(--red)]" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">{dictionary.home.earlyAdmission}</p>
                <h2 className="mt-2 text-3xl font-semibold">{dictionary.home.italyHere}</h2>
              </div>
              <img className="flag-image h-16 w-24 rounded-sm ring-1 ring-white/20" src={italy.flagUrl} alt={dictionary.common.italyFlag} />
            </div>
            <div className="realistic-tombstone-scene mt-5">
              <div className="realistic-tombstone max-w-sm">
                <div className="realistic-tombstone-content !px-7 !pb-8 !pt-16">
                  <p className="engraved-label">{dictionary.common.inMemory}</p>
                  <p className="engraved-name mt-3 !text-5xl">ITALY</p>
                  <div className="engraved-rule" />
                  <p className="engraved-copy text-base leading-6">
                    {dictionary.home.italyEpitaph}
                  </p>
                </div>
              </div>
              <div className="tombstone-base max-w-md" />
              <p className="mt-5 text-xs uppercase tracking-[0.2em] text-[var(--gold)]">{dictionary.home.paperwork}</p>
            </div>
            <div className="mt-7 grid grid-cols-4 gap-3">
              <Stat label={dictionary.common.tombs} value={italy.tombstoneCount} />
              <Stat label={dictionary.common.flowers} value={italy.flowerCount} />
              <Stat label={dictionary.common.candles} value={italy.candleCount} />
              <Stat label={dictionary.common.incense} value={italy.incenseCount} />
            </div>
          </div>
        </Section>

        <Section id="team-wall" className="py-12">
          <div className="flex flex-col justify-between gap-5 border-t border-white/10 pt-10 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-semibold">{dictionary.home.wallTitle}</h2>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">
                {seededTeams.length - 1} {dictionary.home.wallBody}
              </p>
            </div>
            <div className="flex gap-4 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-2">
                <Flower2 size={16} /> {dictionary.common.flowers}
              </span>
              <span className="flex items-center gap-2">
                <Flame size={16} /> {dictionary.common.candles}
              </span>
              <span className="flex items-center gap-2">
                <ScrollText size={16} /> {dictionary.common.incense}
              </span>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teams.map((team) => (
              <TeamCard key={team.slug} team={team} locale={locale} dictionary={dictionary} />
            ))}
          </div>
        </Section>

        <Section className="py-14">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-3 text-3xl font-semibold">
              <Activity className="text-[var(--gold)]" /> {dictionary.home.latestBurials}
            </h2>
            <LinkButton href={localizePath("/feed", locale)} variant="secondary">
              {dictionary.home.openFeed}
            </LinkButton>
          </div>
          {latest.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {latest.map((tombstone) => (
                <TombstoneCard key={tombstone.id} tombstone={tombstone} team={italy} locale={locale} dictionary={dictionary} />
              ))}
            </div>
          ) : (
            <div className="stone-panel rounded-md p-8 text-center text-[var(--muted)]">
              {dictionary.home.emptyLatest}
            </div>
          )}
        </Section>
      </main>
    </>
  );
}
