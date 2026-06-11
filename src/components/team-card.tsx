import { Flower2, Flame, ScrollText } from "lucide-react";
import type { Team } from "@/lib/types";
import { LinkButton } from "./ui";

export function TeamCard({ team }: { team: Team }) {
  const playable = team.isPlayable;

  return (
    <article className="stone-panel flex min-h-[260px] flex-col rounded-md p-4">
      <div className="flex items-start justify-between gap-3">
        <img
          className={`flag-image h-14 w-20 rounded-sm ring-1 ring-white/15 ${playable ? "" : "flag-dead"}`}
          src={team.flagUrl}
          alt={`${team.name} flag`}
        />
        {team.status === "early_admission" ? (
          <span className="rounded-sm border border-[var(--gold)]/50 bg-[var(--gold)]/12 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
            Early Admission
          </span>
        ) : (
          <span className="rounded-sm border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Still alive
          </span>
        )}
      </div>
      <div className="mt-5 flex-1">
        <h3 className="text-xl font-semibold">{team.name}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--muted)]">
          {playable
            ? "Arrived early. Not at the World Cup. At the Funeral Home."
            : "Not admitted yet. This team is still alive."}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 border-y border-white/10 py-3 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-1">
          <Flower2 size={13} /> {team.flowerCount}
        </span>
        <span className="flex items-center gap-1">
          <Flame size={13} /> {team.candleCount}
        </span>
        <span className="flex items-center gap-1">
          <ScrollText size={13} /> {team.incenseCount}
        </span>
      </div>
      {playable ? (
        <LinkButton className="mt-4 w-full" href={`/create?team=${team.slug}`}>
          Build a Tombstone
        </LinkButton>
      ) : (
        <button
          className="mt-4 min-h-11 rounded-sm border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
          disabled
          title="This team is still alive. Please do not arrange the funeral too early."
        >
          Not available yet
        </button>
      )}
    </article>
  );
}
