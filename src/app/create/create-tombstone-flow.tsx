"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ScrollText } from "lucide-react";
import { getTeamContentPack, italyDeathMatch } from "@/lib/seed-data";
import type { Team, TeamContentPack } from "@/lib/types";
import type { Match } from "@/lib/types";
import { validateRequiredSignature, validateUserText } from "@/lib/validation";
import { Button, LinkButton } from "@/components/ui";

const steps = ["Choose Team", "Death Match", "Cause", "Epitaph", "Preview"];

type FieldErrors = {
  buriedBy?: string;
};

export function CreateTombstoneFlow({
  playableTeams,
  deathMatches,
  contentByTeam,
}: {
  playableTeams: Team[];
  deathMatches: Match[];
  contentByTeam: Record<string, TeamContentPack>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fallbackTeam = playableTeams[0]?.slug ?? "italy";
  const requestedTeam = searchParams.get("team") ?? fallbackTeam;
  const initialTeam =
    playableTeams.some((team) => team.slug === requestedTeam) ? requestedTeam : fallbackTeam;
  const initialContent = contentByTeam[initialTeam] ?? getTeamContentPack(initialTeam);
  const [step, setStep] = useState(0);
  const [teamSlug, setTeamSlug] = useState(initialTeam);
  const [cause, setCause] = useState(initialContent.causes[0]?.text ?? "");
  const [customCause, setCustomCause] = useState("");
  const [epitaph, setEpitaph] = useState(initialContent.epitaphs[0]?.text ?? "");
  const [customEpitaph, setCustomEpitaph] = useState("");
  const [buriedBy, setBuriedBy] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [publishing, setPublishing] = useState(false);

  const selectedTeam = useMemo(
    () => playableTeams.find((team) => team.slug === teamSlug) ?? playableTeams[0],
    [playableTeams, teamSlug],
  );
  const selectedContent = useMemo(
    () => contentByTeam[teamSlug] ?? getTeamContentPack(teamSlug),
    [contentByTeam, teamSlug],
  );
  const genericCauseOptions = selectedContent.causes.filter((item) => !item.isTeamSpecific);
  const teamCauseOptions = selectedContent.causes.filter((item) => item.isTeamSpecific);
  const epitaphOptions = selectedContent.epitaphs;
  const selectedDeathMatch =
    deathMatches.find((match) => match.id === selectedTeam?.deathMatchId) ?? italyDeathMatch;
  const finalCause = customCause.trim() || cause;
  const finalEpitaph = customEpitaph.trim() || epitaph;
  const finalBuriedBy = buriedBy.trim().replace(/\s+/g, " ").slice(0, 30);
  const buriedByHasError = Boolean(fieldErrors.buriedBy);

  function chooseTeam(slug: string) {
    const nextContent = contentByTeam[slug] ?? getTeamContentPack(slug);
    setTeamSlug(slug);
    setCause(nextContent.causes[0]?.text ?? "");
    setEpitaph(nextContent.epitaphs[0]?.text ?? "");
    setCustomCause("");
    setCustomEpitaph("");
  }

  function validateCurrentStep() {
    setError("");
    setFieldErrors({});
    if (!selectedTeam?.isPlayable) {
      setError("This team is still alive. Funeral paperwork is not accepted yet.");
      return false;
    }

    const checks =
      step === 2
        ? [validateUserText(finalCause, 80)]
        : step === 3
          ? [validateUserText(finalEpitaph, 120), validateRequiredSignature(buriedBy, 30)]
          : [];

    const failed = checks.find((check) => !check.ok);
    if (failed && !failed.ok) {
      setError(failed.message);
      if (step === 3 && failed.message === "Buried by is required.") {
        setFieldErrors({ buriedBy: failed.message });
      }
      return false;
    }
    return true;
  }

  function validatePublishFields() {
    setError("");
    setFieldErrors({});

    const causeValidation = validateUserText(finalCause, 80);
    if (!causeValidation.ok) {
      setStep(2);
      setError(causeValidation.message);
      return false;
    }

    const epitaphValidation = validateUserText(finalEpitaph, 120);
    if (!epitaphValidation.ok) {
      setStep(3);
      setError(epitaphValidation.message);
      return false;
    }

    const signatureValidation = validateRequiredSignature(buriedBy, 30);
    if (!signatureValidation.ok) {
      setStep(3);
      setError(signatureValidation.message);
      setFieldErrors({ buriedBy: signatureValidation.message });
      return false;
    }

    return true;
  }

  function next() {
    if (validateCurrentStep()) {
      setStep((value) => Math.min(value + 1, steps.length - 1));
    }
  }

  async function publish() {
    if (!validatePublishFields()) return;
    setPublishing(true);
    setError("");
    const response = await fetch("/api/tombstones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamSlug,
        causeOfDeath: finalCause,
        epitaph: finalEpitaph,
        buriedBy,
      }),
    });
    const payload = await response.json();
    setPublishing(false);

    if (!response.ok) {
      setError(payload.message ?? "Unable to publish tombstone.");
      return;
    }

    router.push(`/tombstone/${payload.tombstone.shareSlug}?published=1`);
  }

  if (!selectedTeam) {
    return (
      <div className="stone-panel rounded-md p-8 text-center">
        <h1 className="text-3xl font-semibold">No team is ready for burial.</h1>
        <p className="mt-3 text-[var(--muted)]">
          The Funeral Home opens when a team has been eliminated.
        </p>
        <div className="mt-6">
          <LinkButton href="/" variant="secondary">
            Back to Team Wall
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Build a Tombstone</h1>
          <p className="mt-3 text-[var(--muted)]">
            Choose a fallen team. Confirm the death match. Pick the cause. Carve the epitaph. Sign the stone.
          </p>
        </div>
        <LinkButton href="/" variant="secondary">
          Back to Team Wall
        </LinkButton>
      </div>

      <div className="mb-8 grid gap-2 sm:grid-cols-5">
        {steps.map((label, index) => (
          <button
            key={label}
            className={`rounded-sm border px-3 py-3 text-left text-sm ${
              index === step
                ? "border-[var(--gold)] bg-[var(--gold)]/12 text-[var(--gold)]"
                : index < step
                  ? "border-white/15 bg-white/8 text-white"
                  : "border-white/10 bg-white/[0.03] text-[var(--muted)]"
            }`}
            onClick={() => setStep(index)}
          >
            <span className="block font-mono text-xs">0{index + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <section className="stone-panel rounded-md p-5 sm:p-8">
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-semibold">Choose Team</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {playableTeams.map((team) => (
                  <button
                    key={team.slug}
                    className={`rounded-md border p-4 text-left transition ${
                      teamSlug === team.slug ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-white/10 bg-white/[0.03]"
                    }`}
                    onClick={() => chooseTeam(team.slug)}
                  >
                    <img
                      className={`h-12 w-16 rounded-sm object-cover ${team.isPlayable ? "" : "flag-dead"}`}
                      src={team.flagUrl}
                      alt={`${team.name} flag`}
                    />
                    <h3 className="mt-4 text-xl font-semibold">{team.name}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      The Funeral Home is open.
                    </p>
                  </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold">Confirm Death Match</h2>
            <div className="mt-6 rounded-md border border-white/10 bg-black/20 p-6">
              <p className="text-lg leading-8">{selectedDeathMatch.displayText}</p>
              <p className="mt-4 text-[var(--gold)]">{selectedDeathMatch.broadcastText}</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-semibold">Choose a Cause of Death</h2>
            <p className="mt-2 text-[var(--muted)]">Pick one from the official paperwork, or write your own.</p>
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Generic Causes
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {genericCauseOptions.map((item) => (
                  <button
                    key={item.id}
                    className={`rounded-sm border p-4 text-left text-sm ${
                      cause === item.text && !customCause
                        ? "border-[var(--gold)] bg-[var(--gold)]/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                    onClick={() => {
                      setCause(item.text);
                      setCustomCause("");
                    }}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-7">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                {selectedTeam.name} Paperwork
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {teamCauseOptions.map((item) => (
                  <button
                    key={item.id}
                    className={`rounded-sm border p-4 text-left text-sm ${
                      cause === item.text && !customCause
                        ? "border-[var(--gold)] bg-[var(--gold)]/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                    onClick={() => {
                      setCause(item.text);
                      setCustomCause("");
                    }}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
            <input
              className="mt-5 w-full rounded-sm border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-[var(--gold)]"
              maxLength={80}
              placeholder="Write a more painful cause of death..."
              value={customCause}
              onChange={(event) => setCustomCause(event.target.value)}
            />
            <p className="mt-2 text-sm text-[var(--muted)]">Be funny. Be cruel to the football. Not to real people.</p>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-semibold">Choose an Epitaph</h2>
            <p className="mt-2 text-[var(--muted)]">Pick a final line, or carve your own.</p>
            <div className="mt-6 grid gap-3">
              {epitaphOptions.map((item) => (
                <button
                  key={item.id}
                  className={`rounded-sm border p-4 text-left ${
                    epitaph === item.text && !customEpitaph
                      ? "border-[var(--gold)] bg-[var(--gold)]/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                  onClick={() => {
                    setEpitaph(item.text);
                    setCustomEpitaph("");
                  }}
                >
                  {item.text}
                </button>
              ))}
            </div>
            <textarea
              className="mt-5 min-h-28 w-full rounded-sm border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-[var(--gold)]"
              maxLength={120}
              placeholder="Write the final line this team deserves..."
              value={customEpitaph}
              onChange={(event) => setCustomEpitaph(event.target.value)}
            />
            <input
              aria-invalid={buriedByHasError}
              className={`mt-5 w-full rounded-sm border bg-black/25 px-4 py-3 outline-none ${
                buriedByHasError
                  ? "border-[var(--red)] focus:border-[var(--red)]"
                  : "border-white/10 focus:border-[var(--gold)]"
              }`}
              maxLength={30}
              placeholder="Your name or nickname"
              value={buriedBy}
              onChange={(event) => {
                setBuriedBy(event.target.value);
                if (fieldErrors.buriedBy) {
                  setFieldErrors({});
                  setError("");
                }
              }}
            />
            <p className="mt-2 text-sm text-[var(--muted)]">Required. Keep it about football trauma. Don’t attack real people.</p>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-2xl font-semibold">Preview Tombstone</h2>
            <div className="realistic-tombstone-scene mt-8">
              <div className="realistic-tombstone">
                <div className="realistic-tombstone-content">
                  <img
                    className="realistic-tombstone-flag"
                    src={selectedTeam.flagUrl}
                    alt={`${selectedTeam.name} flag`}
                  />
                  <p className="engraved-label mt-6">In Loving Memory of</p>
                  <h3 className="engraved-name mt-3">{selectedTeam.name}</h3>
                  <div className="engraved-rule" />
                  <p className="engraved-label">Cause of Death</p>
                  <p className="engraved-copy mt-2 text-xl font-bold">{finalCause}</p>
                  <p className="engraved-copy mt-7 text-2xl font-semibold leading-8">“{finalEpitaph}”</p>
                  <p className="engraved-label mt-7">Buried by: {finalBuriedBy}</p>
                </div>
              </div>
              <div className="tombstone-base" />
            </div>
          </div>
        )}

        {error && <p className="mt-6 rounded-sm border border-[var(--red)]/50 bg-[var(--red)]/15 p-3 text-sm text-red-100">{error}</p>}

        <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
          <Button variant="secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(value - 1, 0))}>
            <ArrowLeft size={16} /> Edit
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={next}>
              Continue <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={publish} disabled={publishing}>
              {publishing ? "Publishing..." : "Publish Tombstone"} <Check size={16} />
            </Button>
          )}
        </div>
      </section>

      <div className="mt-6 flex items-center gap-2 text-sm text-[var(--muted)]">
        <ScrollText size={16} />
        No links. No hate speech. No attacks on real people. Just football pain in a nice stone jacket.
      </div>
    </div>
  );
}
