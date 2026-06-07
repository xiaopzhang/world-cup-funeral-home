import { Activity, Flower2, Flame, ScrollText } from "lucide-react";
import { getHomeSnapshot } from "@/lib/repository";
import { teams as seededTeams } from "@/lib/seed-data";
import { SiteHeader } from "@/components/site-header";
import { TeamCard } from "@/components/team-card";
import { TombstoneCard } from "@/components/tombstone-card";
import { LinkButton, Section, Stat } from "@/components/ui";
import { serializeJsonLd, websiteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const snapshot = await getHomeSnapshot();
  const italy = snapshot.teams.find((team) => team.slug === "italy")!;
  const latest = snapshot.latestTombstones;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      websiteJsonLd(),
      {
        "@type": "WebPage",
        name: "World Cup Funeral Home",
        description:
          "Create and share satirical tombstones for eliminated World Cup teams.",
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
      <SiteHeader />
      <main>
        <Section className="grid min-h-[calc(100vh-65px)] items-center gap-10 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
          <div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.94] tracking-normal text-[var(--foreground)] sm:text-7xl lg:text-8xl">
              World Cup Funeral Home
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-8 text-[var(--muted)]">
              A funeral home for eliminated teams, broken dreams, and emotionally damaged football fans.
            </p>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#d8ccb6]">
              Gray flags are still alive. Full-color flags are ready for burial. Italy arrived early.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/create?team=italy">Build a Tombstone</LinkButton>
              <LinkButton href="/feed" variant="secondary">
                View Latest Burials
              </LinkButton>
            </div>
          </div>

          <div className="stone-panel relative overflow-hidden rounded-md p-5 sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--green)] via-white to-[var(--red)]" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Early Admission</p>
                <h2 className="mt-2 text-3xl font-semibold">Italy is already here.</h2>
              </div>
              <img className="h-16 w-24 rounded-sm object-cover ring-1 ring-white/20" src={italy.flagUrl} alt="Italy flag" />
            </div>
            <div className="realistic-tombstone-scene mt-5">
              <div className="realistic-tombstone max-w-sm">
                <div className="realistic-tombstone-content !px-7 !pb-8 !pt-16">
                  <p className="engraved-label">In Loving Memory of</p>
                  <p className="engraved-name mt-3 !text-5xl">ITALY</p>
                  <div className="engraved-rule" />
                  <p className="engraved-copy text-base leading-6">
                    The anthem was ready. The invitation was not.
                  </p>
                </div>
              </div>
              <div className="tombstone-base max-w-md" />
              <p className="mt-5 text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Build the paperwork</p>
            </div>
            <div className="mt-7 grid grid-cols-4 gap-3">
              <Stat label="Tombs" value={italy.tombstoneCount} />
              <Stat label="Flowers" value={italy.flowerCount} />
              <Stat label="Candles" value={italy.candleCount} />
              <Stat label="Incense" value={italy.incenseCount} />
            </div>
          </div>
        </Section>

        <Section id="team-wall" className="py-12">
          <div className="flex flex-col justify-between gap-5 border-t border-white/10 pt-10 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-semibold">The Wall of the Living and the Fallen</h2>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">
                {seededTeams.length - 1} qualified teams are still breathing. Italy did the paperwork early.
              </p>
            </div>
            <div className="flex gap-4 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-2">
                <Flower2 size={16} /> Flowers
              </span>
              <span className="flex items-center gap-2">
                <Flame size={16} /> Candles
              </span>
              <span className="flex items-center gap-2">
                <ScrollText size={16} /> Incense
              </span>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {snapshot.teams.map((team) => (
              <TeamCard key={team.slug} team={team} />
            ))}
          </div>
        </Section>

        <Section className="py-14">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-3 text-3xl font-semibold">
              <Activity className="text-[var(--gold)]" /> Latest Burials
            </h2>
            <LinkButton href="/feed" variant="secondary">
              Open Feed
            </LinkButton>
          </div>
          {latest.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {latest.map((tombstone) => (
                <TombstoneCard key={tombstone.id} tombstone={tombstone} team={italy} />
              ))}
            </div>
          ) : (
            <div className="stone-panel rounded-md p-8 text-center text-[var(--muted)]">
              No burials yet. Italy is waiting with a very dramatic clipboard.
            </div>
          )}
        </Section>
      </main>
    </>
  );
}
