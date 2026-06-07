import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getAdminSnapshot } from "@/lib/repository";
import { Section } from "@/components/ui";

type AdminPageProps = {
  searchParams: Promise<{ password?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | World Cup Funeral Home",
  robots: { index: false, follow: false },
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { password } = await searchParams;
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

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="stone-panel rounded-md p-5">
              <h2 className="text-2xl font-semibold">Team Status</h2>
              <div className="mt-4 max-h-[520px] space-y-2 overflow-auto pr-2">
                {snapshot.teams.map((team) => (
                  <div key={team.slug} className="flex items-center justify-between gap-3 border-b border-white/10 py-3">
                    <div>
                      <p className="font-semibold">{team.name}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        {team.status} · {team.isPlayable ? "playable" : "locked"}
                      </p>
                    </div>
                    <code className="text-xs text-[var(--muted)]">{team.slug}</code>
                  </div>
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
