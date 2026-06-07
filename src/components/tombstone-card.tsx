import Link from "next/link";
import type { Team, Tombstone } from "@/lib/types";

export function TombstoneCard({
  tombstone,
  team,
}: {
  tombstone: Tombstone;
  team: Team;
}) {
  return (
    <Link
      href={`/tombstone/${tombstone.shareSlug}`}
      className="stone-panel block rounded-md p-5 transition hover:-translate-y-0.5 hover:border-[var(--gold)]/50"
    >
      <div className="flex items-center gap-3">
        <img className="h-9 w-12 rounded-sm object-cover" src={team.flagUrl} alt={`${team.name} flag`} />
        <div>
          <div className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">In Loving Memory of</div>
          <h3 className="text-xl font-semibold">{team.name}</h3>
        </div>
      </div>
      <p className="mt-5 text-sm text-[var(--muted)]">Cause of Death</p>
      <p className="mt-1 font-semibold">{tombstone.causeOfDeath}</p>
      <p className="mt-4 text-lg leading-7 text-[var(--gold)]">“{tombstone.epitaph}”</p>
      <p className="mt-4 text-sm text-[var(--muted)]">Buried by {tombstone.buriedBy}</p>
    </Link>
  );
}
