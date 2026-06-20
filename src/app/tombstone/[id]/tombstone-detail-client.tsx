"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  Flame,
  Flower2,
  Gift,
  MessageSquare,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import {
  dictionaries,
  localizeMatch,
  localizePath,
  localizeShareHooks,
  localizeTeam,
  localizeTombstone,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";
import type { InteractionType, TombstoneDetails } from "@/lib/types";
import { shareTombstone } from "@/lib/share";
import {
  sortTributesForDisplay,
  tributeScore,
  type TributeSortMode,
  type TributeVoteType,
} from "@/lib/tribute-engagement";
import { Button, LinkButton, Stat } from "@/components/ui";

export function TombstoneDetailClient({
  id,
  initialDetails,
  locale = "en",
  dictionary = dictionaries.en,
}: {
  id: string;
  initialDetails: TombstoneDetails | null;
  locale?: Locale;
  dictionary?: Dictionary;
}) {
  const [details, setDetails] = useState<TombstoneDetails | null>(initialDetails);
  const [loading, setLoading] = useState(!initialDetails);
  const [message, setMessage] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [manualShareText, setManualShareText] = useState("");
  const [tributeText, setTributeText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submittingTribute, setSubmittingTribute] = useState(false);
  const [downloadingPoster, setDownloadingPoster] = useState(false);
  const [ritualBurst, setRitualBurst] = useState<{ type: InteractionType; id: number } | null>(null);
  const [tributeSortMode, setTributeSortMode] = useState<TributeSortMode>("hot");
  const [posterUrl, setPosterUrl] = useState("");
  const posterRef = useRef<HTMLDivElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const posterObjectUrlRef = useRef<string | null>(null);
  const labels = dictionary.detail;

  const localizeDetailsPayload = useCallback((payload: TombstoneDetails | null): TombstoneDetails | null => {
    if (!payload) return payload;
    return {
      ...payload,
      team: localizeTeam(payload.team, locale),
      deathMatch: localizeMatch(payload.deathMatch, locale),
      tombstone: localizeTombstone(payload.tombstone, locale),
    };
  }, [locale]);

  useEffect(() => {
    const posterUrlFrame = window.requestAnimationFrame(() => {
      setPosterUrl(window.location.href.split("?")[0]);
    });

    fetch(`/api/tombstones/${id}`)
      .then((response) => response.json())
      .then((payload) => {
        setDetails(localizeDetailsPayload(payload.tombstone ? payload : initialDetails));
        setLoading(false);
        if (new URLSearchParams(window.location.search).has("published")) {
          setShowShare(true);
        }
      });

    return () => {
      window.cancelAnimationFrame(posterUrlFrame);
      if (posterObjectUrlRef.current) {
        URL.revokeObjectURL(posterObjectUrlRef.current);
        posterObjectUrlRef.current = null;
      }
    };
  }, [id, initialDetails, localizeDetailsPayload]);

  async function ritual(interactionType: InteractionType) {
    const burstId = Date.now();
    setRitualBurst({ type: interactionType, id: burstId });
    window.setTimeout(() => {
      setRitualBurst((current) => (current?.id === burstId ? null : current));
    }, 850);

    const response = await fetch(`/api/tombstones/${id}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interactionType }),
    });
    const payload = await response.json();
    if (response.ok) {
      setDetails(localizeDetailsPayload(payload));
      setMessage(labels.feedback[interactionType]);
      setShowShare(true);
    } else {
      setMessage(payload.message ?? labels.ritualError);
    }
  }

  async function leaveTribute() {
    if (submittingTribute) return;
    setSubmittingTribute(true);
    const response = await fetch(`/api/tombstones/${id}/tributes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tributeText, authorName }),
    });
    const payload = await response.json();
    setSubmittingTribute(false);
    if (response.ok) {
      setDetails(localizeDetailsPayload(payload));
      setTributeText("");
      setAuthorName("");
      setMessage(labels.tributeReceived);
      setShowShare(true);
    } else {
      setMessage(payload.message ?? labels.tributeRejected);
    }
  }

  async function voteTribute(tributeId: string, voteType: TributeVoteType) {
    const response = await fetch(`/api/tributes/${tributeId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voteType }),
    });
    const payload = await response.json();
    if (response.ok && payload.details) {
      setDetails(localizeDetailsPayload(payload.details));
      setMessage(voteType === "like" ? labels.tributeLiked : labels.tributeDisliked);
    } else {
      setMessage(payload.message ?? labels.voteRejected);
    }
  }

  async function reportContent(targetType: "tombstone" | "tribute", targetId: string) {
    const reason = window.prompt(
      targetType === "tombstone"
        ? labels.reviewTombstonePrompt
        : labels.reviewTributePrompt,
      labels.reviewDefault,
    );
    if (!reason?.trim()) return;

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason }),
    });
    const payload = await response.json();
    setMessage(
      response.ok
        ? labels.reportReceived
        : payload.message ?? labels.reportFailed,
    );
  }

  async function copyShare() {
    const url = window.location.href.split("?")[0];
    if (!details) return;
    const hook = shareHooks.tombstone[0];
    const result = await shareTombstone({
      title: `${details.team.name} Tombstone`,
      text: hook,
      url,
    });

    if (result === "shared") {
      setManualShareText("");
      setMessage(labels.shareOpened);
    } else if (result === "copied") {
      setManualShareText("");
      setMessage(labels.shareCopied);
    } else {
      setManualShareText(result.text);
      setMessage(labels.shareManual);
    }
  }

  async function downloadPoster() {
    if (!posterRef.current || downloadingPoster) return;
    setDownloadingPoster(true);
    setMessage(labels.preparingPosterMessage);
    try {
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: window.innerWidth < 640 ? 1.35 : 2,
        cacheBust: true,
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const nextObjectUrl = URL.createObjectURL(blob);

      if (posterObjectUrlRef.current) {
        URL.revokeObjectURL(posterObjectUrlRef.current);
      }
      posterObjectUrlRef.current = nextObjectUrl;

      const link = downloadLinkRef.current;
      if (!link) {
        window.open(nextObjectUrl, "_blank", "noopener,noreferrer");
        setMessage(labels.posterOpened);
        return;
      }

      link.download = `${team.slug}-world-cup-funeral-home-poster-${Date.now()}.png`;
      link.href = nextObjectUrl;
      link.click();
      setMessage(labels.posterDownloaded);
    } catch {
      setMessage(labels.posterFailed);
    } finally {
      setDownloadingPoster(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-6xl px-4 py-10">{labels.loading}</main>;
  }

  if (!details) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-4xl font-semibold">{labels.notFoundTitle}</h1>
        <p className="mt-4 text-[var(--muted)]">{labels.notFoundBody}</p>
        <LinkButton className="mt-8" href={localizePath("/", locale)}>
          {dictionary.common.backToTeamWall}
        </LinkButton>
      </main>
    );
  }

  const { tombstone, team, tributes } = details;
  const shareHooks = localizeShareHooks(team.slug, team.name, locale);
  const sortedTributes = sortTributesForDisplay(tributes, tributeSortMode);

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
      <section>
        <div ref={posterRef} className="rounded-md bg-[#171511] p-8 text-center text-[var(--foreground)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">{dictionary.common.siteName}</p>
          <div className="realistic-tombstone-scene mt-8">
            <div className="realistic-tombstone">
              <div className="realistic-tombstone-content">
                <img className="realistic-tombstone-flag flag-image" src={team.flagUrl} alt={`${team.name} flag`} />
                <p className="engraved-label mt-6">{dictionary.common.inMemory}</p>
                <h1 className="engraved-name mt-3">{team.name}</h1>
                <div className="engraved-rule" />
                <p className="engraved-label">{dictionary.common.causeOfDeath}</p>
                <p className="engraved-copy mt-2 text-xl font-bold">{tombstone.causeOfDeath}</p>
                <p className="engraved-copy mt-7 text-3xl font-semibold leading-10">“{tombstone.epitaph}”</p>
                <p className="engraved-label mt-7">{dictionary.create.buriedBy} {tombstone.buriedBy}</p>
              </div>
            </div>
            <div className="tombstone-base" />
          </div>
          <p className="mt-5 text-lg text-[var(--gold)]">
            {team.flowerCount + team.candleCount + team.incenseCount + team.tributeCount} {labels.respectsCount}
          </p>
          <div className="mx-auto mt-5 max-w-md rounded-sm border border-[var(--gold)]/35 bg-black/25 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
              {labels.respectsHere}
            </p>
            <p className="mt-1 break-all font-mono text-xs leading-5 text-[#f6efe1]" suppressHydrationWarning>
              {posterUrl}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="relative">
            <Button className="w-full" variant="secondary" onClick={() => ritual("flower")}>
              <Flower2 size={17} /> {labels.offerFlowers}
            </Button>
            {ritualBurst?.type === "flower" && (
              <span key={ritualBurst.id} className="ritual-plus absolute right-3 top-1/2 text-sm font-bold text-[var(--gold)]">
                +1
              </span>
            )}
          </div>
          <div className="relative">
            <Button className="w-full" variant="secondary" onClick={() => ritual("candle")}>
              <Flame size={17} /> {labels.lightCandle}
            </Button>
            {ritualBurst?.type === "candle" && (
              <span key={ritualBurst.id} className="ritual-plus absolute right-3 top-1/2 text-sm font-bold text-[var(--gold)]">
                +1
              </span>
            )}
          </div>
          <div className="relative">
            <Button className="w-full" variant="secondary" onClick={() => ritual("incense")}>
              <Sparkles size={17} /> {labels.burnIncense}
            </Button>
            {ritualBurst?.type === "incense" && (
              <span key={ritualBurst.id} className="ritual-plus absolute right-3 top-1/2 text-sm font-bold text-[var(--gold)]">
                +1
              </span>
            )}
          </div>
          <Button onClick={copyShare}>
            <Share2 size={17} /> {labels.shareTombstone}
          </Button>
        </div>
        <Button className="mt-3 w-full" variant="secondary" onClick={downloadPoster} disabled={downloadingPoster}>
          <Gift size={17} /> {downloadingPoster ? labels.preparingPoster : labels.downloadPoster}
        </Button>
        <a ref={downloadLinkRef} className="sr-only" tabIndex={-1} aria-hidden="true">
          {labels.downloadPosterHidden}
        </a>
        <LinkButton className="mt-3 w-full sm:hidden" href={localizePath("/create?team=italy", locale)}>
          {labels.buildOwn}
        </LinkButton>
        <button
          className="mt-3 text-xs text-[var(--muted)] underline underline-offset-4"
          onClick={() => reportContent("tombstone", tombstone.id)}
        >
          {labels.reportTombstone}
        </button>
        {message && <p className="mt-4 rounded-sm border border-white/10 bg-white/5 p-3 text-sm text-[var(--muted)]">{message}</p>}
        {manualShareText && (
          <div className="mt-3 rounded-sm border border-[var(--gold)]/35 bg-[var(--gold)]/10 p-3">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              {labels.shareText}
            </label>
            <textarea
              className="mt-2 min-h-20 w-full rounded-sm border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none"
              readOnly
              value={manualShareText}
              onFocus={(event) => event.currentTarget.select()}
            />
          </div>
        )}
      </section>

      <aside className="space-y-5">
        {showShare && (
          <div className="stone-panel rounded-md p-5">
            <h2 className="text-xl font-semibold">{labels.readyTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {labels.readyBody}
            </p>
            <div className="mt-4 flex gap-3">
              <Button onClick={copyShare}>{labels.share}</Button>
              <Button variant="secondary" onClick={() => setShowShare(false)}>
                {labels.continueMourning}
              </Button>
            </div>
          </div>
        )}

        <div className="stone-panel hidden rounded-md p-5 sm:block">
          <h2 className="text-xl font-semibold">{labels.sidebarBuildTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {labels.sidebarBuildBody}
          </p>
          <LinkButton className="mt-4 w-full" href={localizePath("/create?team=italy", locale)}>
            {dictionary.common.buildTombstone}
          </LinkButton>
        </div>

        <div className="stone-panel rounded-md p-5">
          <h2 className="text-xl font-semibold">{labels.received}</h2>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <Stat label={dictionary.common.flowers} value={tombstone.flowerCount} />
            <Stat label={dictionary.common.candles} value={tombstone.candleCount} />
            <Stat label={dictionary.common.incense} value={tombstone.incenseCount} />
          </div>
        </div>

        <div className="stone-panel rounded-md p-5">
          <h2 className="text-xl font-semibold">{labels.teamStats}</h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Stat label={dictionary.common.tombstones} value={team.tombstoneCount} />
            <Stat label={dictionary.common.flowers} value={team.flowerCount} />
            <Stat label={dictionary.common.candles} value={team.candleCount} />
            <Stat label={dictionary.common.incense} value={team.incenseCount} />
          </div>
        </div>

        <div className="stone-panel rounded-md p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <MessageSquare size={20} /> {labels.leaveTribute}
          </h2>
          <textarea
            className="mt-4 min-h-28 w-full rounded-sm border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-[var(--gold)]"
            maxLength={160}
            placeholder={labels.tributePlaceholder}
            value={tributeText}
            onChange={(event) => setTributeText(event.target.value)}
          />
          <input
            className="mt-3 w-full rounded-sm border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-[var(--gold)]"
            maxLength={30}
            placeholder={labels.authorPlaceholder}
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
          />
          <p className="mt-2 text-xs text-[var(--muted)]">{labels.tributeHint}</p>
          <Button className="mt-4 w-full" onClick={leaveTribute} disabled={!tributeText.trim() || submittingTribute}>
            {submittingTribute ? labels.sending : labels.leaveTribute}
          </Button>
        </div>

        <div className="stone-panel rounded-md p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-xl font-semibold">{labels.tributeWall}</h2>
            <div className="grid grid-cols-2 rounded-sm border border-white/10 bg-black/20 p-1 text-xs">
              {(["hot", "newest"] as TributeSortMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`rounded-sm px-3 py-2 font-semibold uppercase tracking-[0.14em] ${
                    tributeSortMode === mode
                      ? "bg-[var(--gold)] text-[#14110d]"
                      : "text-[var(--muted)]"
                  }`}
                  onClick={() => setTributeSortMode(mode)}
                >
                  {mode === "hot" ? labels.hot : labels.newest}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {sortedTributes.length ? (
              sortedTributes.map((tribute) => (
                <div key={tribute.id} className="rounded-sm border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-sm leading-6">“{tribute.tributeText}”</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{labels.by} {tribute.authorName}</p>
                    <p className="font-mono text-xs text-[var(--muted)]">{labels.score} {tributeScore(tribute)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center gap-1 rounded-sm border border-white/10 bg-black/20 px-2 py-1 text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]"
                      onClick={() => voteTribute(tribute.id, "like")}
                    >
                      <ThumbsUp size={13} /> {tribute.likeCount}
                    </button>
                    <button
                      className="inline-flex items-center gap-1 rounded-sm border border-white/10 bg-black/20 px-2 py-1 text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]"
                      onClick={() => voteTribute(tribute.id, "dislike")}
                    >
                      <ThumbsDown size={13} /> {tribute.dislikeCount}
                    </button>
                    <button
                      className="px-2 py-1 text-xs text-[var(--muted)] underline underline-offset-4"
                      onClick={() => reportContent("tribute", tribute.id)}
                    >
                      {labels.report}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">{labels.noTributes}</p>
            )}
          </div>
        </div>
      </aside>
    </main>
  );
}
