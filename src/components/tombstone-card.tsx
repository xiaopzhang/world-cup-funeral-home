import Link from "next/link";
import { dictionaries, localizePath, type Dictionary, type Locale } from "@/lib/i18n";
import type { Team, Tombstone } from "@/lib/types";

export function TombstoneCard({
  tombstone,
  team,
  locale = "en",
  dictionary = dictionaries.en,
}: {
  tombstone: Tombstone;
  team: Team;
  locale?: Locale;
  dictionary?: Dictionary;
}) {
  return (
    <Link
      href={localizePath(`/tombstone/${tombstone.shareSlug}`, locale)}
      className="stone-panel block rounded-md p-5 transition hover:-translate-y-0.5 hover:border-[var(--gold)]/50"
    >
      <div className="flex items-center gap-3">
        <img className="flag-image h-9 w-12 rounded-sm" src={team.flagUrl} alt={`${team.name} flag`} />
        <div>
          <div className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">{dictionary.common.inMemory}</div>
          <h3 className="text-xl font-semibold">{team.name}</h3>
        </div>
      </div>
      <p className="mt-5 text-sm text-[var(--muted)]">{dictionary.common.causeOfDeath}</p>
      <p className="mt-1 font-semibold">{tombstone.causeOfDeath}</p>
      <p className="mt-4 text-lg leading-7 text-[var(--gold)]">“{tombstone.epitaph}”</p>
      <p className="mt-4 text-sm text-[var(--muted)]">{dictionary.tombstoneCard.buriedBy} {tombstone.buriedBy}</p>
    </Link>
  );
}
