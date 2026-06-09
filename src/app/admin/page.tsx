import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getAdminSnapshot } from "@/lib/repository";
import { Section } from "@/components/ui";
import {
  deactivateContentAction,
  handleReportAction,
  syncMemeContentAction,
  updateTeamStatusAction,
} from "./actions";

type AdminPageProps = {
  searchParams: Promise<{
    password?: string;
    updated?: string;
    reportUpdated?: string;
    contentUpdated?: string;
  }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | World Cup Funeral Home",
  robots: { index: false, follow: false },
};

type SyncRunRow = {
  id: string;
  provider: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  processed_count: number;
  changed_count: number;
  error_message: string | null;
};

type ReportRow = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
};

type StatusEventRow = {
  id: string;
  team_id: string;
  provider_match_id: string | null;
  from_status: string;
  to_status: string;
  reason: string;
  source: string;
  created_at: string;
};

type ContentItemRow = {
  id: string;
  type: "cause" | "epitaph";
  teamSlug: string;
  text: string;
  generated: boolean;
};

function formatDateTime(value: string | null) {
  if (!value) return "Not finished";
  return new Date(value).toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusBadgeClass(status: string) {
  if (status === "success" || status === "reviewed") {
    return "border-[var(--green)]/40 bg-[var(--green)]/10 text-green-100";
  }
  if (status === "error" || status === "open") {
    return "border-[var(--red)]/40 bg-[var(--red)]/10 text-red-100";
  }
  return "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]";
}

function teamLabel(teamId: string) {
  return teamId.replace(/^team_/, "").replace(/-/g, " ");
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { password, updated, reportUpdated, contentUpdated } = await searchParams;
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

          {reportUpdated && (
            <div className="mt-6 rounded-md border border-[var(--green)]/40 bg-[var(--green)]/10 p-4 text-sm text-green-100">
              Updated report <code>{reportUpdated}</code>.
            </div>
          )}

          {contentUpdated && (
            <div className="mt-6 rounded-md border border-[var(--green)]/40 bg-[var(--green)]/10 p-4 text-sm text-green-100">
              Updated content <code>{contentUpdated}</code>.
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="stone-panel rounded-md p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Team Status</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Manual overrides immediately affect public creation eligibility.
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
                  </form>
                ))}
              </div>
            </section>

            <section className="stone-panel rounded-md p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h2 className="text-2xl font-semibold">Content Lab</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    DeepSeek refreshes original causes and epitaphs after safety checks.
                  </p>
                </div>
                <form action={syncMemeContentAction} className="flex gap-2">
                  <input name="password" type="hidden" value={password} />
                  <input
                    className="min-h-10 w-36 rounded-sm border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[var(--gold)]"
                    name="slug"
                    placeholder="team slug"
                  />
                  <button className="min-h-10 rounded-sm bg-[var(--gold)] px-3 py-2 text-sm font-semibold text-[#14110d]">
                    Refresh
                  </button>
                </form>
              </div>
              <div className="mt-4 max-h-[760px] space-y-3 overflow-auto pr-2">
                {(snapshot.contentItems as ContentItemRow[]).map((item) => (
                  <article key={`${item.type}_${item.id}`} className="rounded-sm border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                          {item.teamSlug} · {item.type} · {item.generated ? "generated" : "seeded"}
                        </p>
                        <p className="mt-2 text-sm leading-6">{item.text}</p>
                        <code className="mt-2 block truncate text-xs text-[var(--muted)]">{item.id}</code>
                      </div>
                      <form action={deactivateContentAction}>
                        <input name="password" type="hidden" value={password} />
                        <input name="id" type="hidden" value={item.id} />
                        <input name="type" type="hidden" value={item.type} />
                        <button className="min-h-9 rounded-sm border border-[var(--red)]/40 px-3 py-1 text-xs font-semibold text-red-100">
                          Disable
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="stone-panel rounded-md p-5">
              <h2 className="text-2xl font-semibold">Recent Sync Runs</h2>
              <div className="mt-4 space-y-3">
                {(snapshot.syncRuns as SyncRunRow[]).map((run) => (
                  <article key={run.id} className="rounded-sm border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-semibold">{run.provider}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Started {formatDateTime(run.started_at)}
                        </p>
                      </div>
                      <span className={`w-fit rounded-sm border px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(run.status)}`}>
                        {run.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="font-mono text-xl">{run.processed_count}</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Processed</p>
                      </div>
                      <div>
                        <p className="font-mono text-xl">{run.changed_count}</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Changed</p>
                      </div>
                      <div>
                        <p className="font-mono text-xs leading-5">{formatDateTime(run.finished_at)}</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Finished</p>
                      </div>
                    </div>
                    {run.error_message && (
                      <p className="mt-3 rounded-sm border border-[var(--red)]/30 bg-[var(--red)]/10 p-3 text-sm text-red-100">
                        {run.error_message}
                      </p>
                    )}
                  </article>
                ))}
                {!snapshot.syncRuns.length && <p className="text-[var(--muted)]">No sync runs yet.</p>}
              </div>
            </section>

            <section className="stone-panel rounded-md p-5">
              <h2 className="text-2xl font-semibold">Reports</h2>
              <div className="mt-4 space-y-3">
                {(snapshot.reports as ReportRow[]).map((report) => (
                  <article key={report.id} className="rounded-sm border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-semibold capitalize">{report.target_type} report</p>
                        <p className="mt-1 font-mono text-xs text-[var(--muted)]">{report.target_id}</p>
                      </div>
                      <span className={`w-fit rounded-sm border px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6">{report.reason}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      {formatDateTime(report.created_at)}
                    </p>
                    {report.status === "open" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <form action={handleReportAction}>
                          <input name="password" type="hidden" value={password} />
                          <input name="reportId" type="hidden" value={report.id} />
                          <input name="action" type="hidden" value="hide_content" />
                          <button className="min-h-9 rounded-sm bg-[var(--red)] px-3 py-2 text-xs font-semibold text-white">
                            Hide content
                          </button>
                        </form>
                        <form action={handleReportAction}>
                          <input name="password" type="hidden" value={password} />
                          <input name="reportId" type="hidden" value={report.id} />
                          <input name="action" type="hidden" value="dismiss" />
                          <button className="min-h-9 rounded-sm border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
                            Dismiss
                          </button>
                        </form>
                      </div>
                    )}
                  </article>
                ))}
                {!snapshot.reports.length && <p className="text-[var(--muted)]">No reports yet.</p>}
              </div>
            </section>

            <section className="stone-panel rounded-md p-5">
              <h2 className="text-2xl font-semibold">Status Events</h2>
              <div className="mt-4 space-y-3">
                {(snapshot.statusEvents as StatusEventRow[]).map((event) => (
                  <article key={event.id} className="rounded-sm border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-semibold capitalize">{teamLabel(event.team_id)}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {event.from_status} → {event.to_status}
                        </p>
                      </div>
                      <span className="w-fit rounded-sm border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        {event.source}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6">{event.reason}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      <span>{formatDateTime(event.created_at)}</span>
                      {event.provider_match_id && <span>{event.provider_match_id}</span>}
                    </div>
                  </article>
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
