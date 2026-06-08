import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getAdminSnapshot } from "@/lib/repository";
import { Section } from "@/components/ui";
import { updateTeamStatusAction } from "./actions";

type AdminPageProps = {
  searchParams: Promise<{ password?: string; updated?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | World Cup Funeral Home",
  robots: { index: false, follow: false },
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { password, updated } = await searchParams;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const authorized = Boolean(configuredPassword && password === configuredPassword);

  if (!authorized) {
    return (
      <>
        <SiteHeader />
        <main>
          <Section className="py-12">
            <div className="stone-panel mx-auto max-w-xl rounded-md p-8">
              <h1 className="text-3xl font-semibold">Admin Access</h1>
              <form className="mt-6 space-y-4">
                <input
                  className="w-full rounded-sm border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-[var(--gold)]"
                  name="password"
                  placeholder="Admin password"
                  type="password"
                />
                <button className="min-h-11 rounded-sm bg-[var(--gold)] px-4 py-2 font-semibold text-[#14110d]">
                  Open dashboard
                </button>
              </form>
            </div>
          </Section>
        </main>
      </>
    );
  }

  const snapshot = await getAdminSnapshot();

  return (
    <>
      <SiteHeader />
      <main>
        <Section className="py-12">
          <div className="mb-8">
            <h1 className="text-5xl font-semibold">Funeral Control Room</h1>
            <p className="mt-3 text-[var(--muted)]">
              Production status, World Cup sync runs, reports, and rollback notes.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="stone-panel rounded-md p-5">
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">Teams</p>
              <p className="mt-2 font-mono text-3xl">{snapshot.teams.length}</p>
            </div>
            <div className="stone-panel rounded-md p-5">
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">Playable</p>
              <p className="mt-2 font-mono text-3xl">
                {snapshot.teams.filter((team) => team.isPlayable).length}
              </p>
            </div>
            <div className="stone-panel rounded-md p-5">
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">Sync Runs</p>
              <p className="mt-2 font-mono text-3xl">{snapshot.syncRuns.length}</p>
            </div>
            <div className="stone-panel rounded-md p-5">
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">Reports</p>
              <p className="mt-2 font-mono text-3xl">{snapshot.reports.length}</p>
            </div>
          </div>

          {snapshot.usingFallback && (
            <div className="mt-6 rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 text-sm text-[var(--gold)]">
              Supabase env vars are not configured. This dashboard is showing local fallback data.
            </div>
          )}

          {updated && (
            <div className="mt-6 rounded-md border border-[var(--green)]/40 bg-[var(--green)]/10 p-4 text-sm text-green-100">
              Updated team status for <code>{updated}</code>.
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="stone-panel rounded-md p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Team Status</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Manual overrides write an audit event and immediately affect public creation eligibility.
                  </p>
                </div>
              </div>
              <div className="mt-4 max-h-[760px] space-y-4 overflow-auto pr-2">
                {snapshot.teams.map((team) => (
                  <form
                    key={team.slug}
                    action={updateTeamStatusAction}
                    className="rounded-sm border border-white/10 bg-black/20 p-4"
                  >
                    <input name="password" type="hidden" value={password} />
                    <input name="slug" type="hidden" value={team.slug} />
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div className="min-w-0">
                      <p className="font-semibold">{team.name}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        {team.status} · {team.isPlayable ? "playable" : "locked"}
                      </p>
                        <code className="mt-1 block text-xs text-[var(--muted)]">{team.slug}</code>
                      </div>
                      <button className="min-h-10 rounded-sm bg-[var(--gold)] px-3 py-2 text-sm font-semibold text-[#14110d]">
                        Save
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        Status
                        <select
                          className="mt-2 w-full rounded-sm border border-white/10 bg-[#151512] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--gold)]"
                          name="status"
                          defaultValue={team.status}
                        >
                          <option value="alive">Alive</option>
                          <option value="eliminated">Eliminated</option>
                          <option value="early_admission">Early Admission</option>
                          <option value="champion">Champion</option>
                          <option value="pending">Pending</option>
                        </select>
                      </label>

                      <label className="flex items-end gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                        <input
                          className="size-4 accent-[var(--gold)]"
                          name="isPlayable"
                          type="checkbox"
                          defaultChecked={team.isPlayable}
                        />
                        Open tombstone creation
                      </label>

                      <label className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        Eliminated at
                        <input
                          className="mt-2 w-full rounded-sm border border-white/10 bg-black/25 px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--gold)]"
                          name="eliminatedAt"
                          type="date"
                          defaultValue={team.eliminatedAt?.slice(0, 10) ?? ""}
                        />
                      </label>

                      <label className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        Death match id
                        <input
                          className="mt-2 w-full rounded-sm border border-white/10 bg-black/25 px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--gold)]"
                          name="deathMatchId"
                          placeholder="match_manual_team_2026"
                          defaultValue={team.deathMatchId ?? ""}
                        />
                      </label>
                    </div>

                    <label className="mt-3 block text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      Audit reason
                      <input
                        className="mt-2 w-full rounded-sm border border-white/10 bg-black/25 px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--gold)]"
                        name="reason"
                        placeholder="Manual correction after checking official result"
                      />
                    </label>
                  </form>
                ))}
              </div>
            </section>

            <section className="stone-panel rounded-md p-5">
              <h2 className="text-2xl font-semibold">Recent Sync Runs</h2>
              <div className="mt-4 space-y-3">
                {snapshot.syncRuns.map((run) => (
                  <pre key={run.id} className="overflow-auto rounded-sm bg-black/25 p-3 text-xs text-[var(--muted)]">
                    {JSON.stringify(run, null, 2)}
                  </pre>
                ))}
                {!snapshot.syncRuns.length && <p className="text-[var(--muted)]">No sync runs yet.</p>}
              </div>
            </section>

            <section className="stone-panel rounded-md p-5">
              <h2 className="text-2xl font-semibold">Reports</h2>
              <div className="mt-4 space-y-3">
                {snapshot.reports.map((report) => (
                  <pre key={report.id} className="overflow-auto rounded-sm bg-black/25 p-3 text-xs text-[var(--muted)]">
                    {JSON.stringify(report, null, 2)}
                  </pre>
                ))}
                {!snapshot.reports.length && <p className="text-[var(--muted)]">No reports yet.</p>}
              </div>
            </section>

            <section className="stone-panel rounded-md p-5">
              <h2 className="text-2xl font-semibold">Status Events</h2>
              <div className="mt-4 space-y-3">
                {snapshot.statusEvents.map((event) => (
                  <pre key={event.id} className="overflow-auto rounded-sm bg-black/25 p-3 text-xs text-[var(--muted)]">
                    {JSON.stringify(event, null, 2)}
                  </pre>
                ))}
                {!snapshot.statusEvents.length && <p className="text-[var(--muted)]">No status events yet.</p>}
              </div>
            </section>
          </div>
        </Section>
      </main>
    </>
  );
}
