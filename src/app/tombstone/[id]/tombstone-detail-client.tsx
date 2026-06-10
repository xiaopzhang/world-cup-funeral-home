"use client";

import { useEffect, useRef, useState } from "react";
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
import type { InteractionType, TombstoneDetails } from "@/lib/types";
import { getShareHooks } from "@/lib/seed-data";
import { formatTombstoneShareText, shareTombstone } from "@/lib/share";
import {
  sortTributesForDisplay,
  tributeScore,
  type TributeSortMode,
  type TributeVoteType,
} from "@/lib/tribute-engagement";
import { Button, LinkButton, Stat } from "@/components/ui";

const feedback: Record<InteractionType, string> = {
  flower: "Flowers offered. Dignity for the team. Emotional damage for the fans.",
  candle: "Candle lit. May they find their way back in 2030.",
  incense: "Incense burned. May the football gods answer someday.",
};

export function TombstoneDetailClient({
  id,
  initialDetails,
}: {
  id: string;
  initialDetails: TombstoneDetails | null;
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
  const [tributeSortMode, setTributeSortMode] = useState<TributeSortMode>("hot");
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/tombstones/${id}`)
      .then((response) => response.json())
      .then((payload) => {
        setDetails(payload.tombstone ? payload : initialDetails);
        setLoading(false);
        if (new URLSearchParams(window.location.search).has("published")) {
          setShowShare(true);
        }
      });
  }, [id, initialDetails]);

  async function ritual(interactionType: InteractionType) {
    const response = await fetch(`/api/tombstones/${id}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interactionType }),
    });
    const payload = await response.json();
    if (response.ok) {
      setDetails(payload);
      setMessage(feedback[interactionType]);
      setShowShare(true);
    } else {
      setMessage(payload.message ?? "The ritual paperwork jammed.");
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
      setDetails(payload);
      setTributeText("");
      setAuthorName("");
      setMessage("Tribute received. Cheaper than therapy.");
      setShowShare(true);
    } else {
      setMessage(payload.message ?? "Tribute rejected by the paperwork desk.");
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
      setDetails(payload.details);
      setMessage(voteType === "like" ? "Tribute liked." : "Tribute disliked.");
    } else {
      setMessage(payload.message ?? "Vote rejected by the paperwork desk.");
    }
  }

  async function reportContent(targetType: "tombstone" | "tribute", targetId: string) {
    const reason = window.prompt(
      targetType === "tombstone"
        ? "Why should this tombstone be reviewed?"
        : "Why should this tribute be reviewed?",
      "Off-topic or inappropriate football funeral content",
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
        ? "Report received. The funeral desk will review it."
        : payload.message ?? "Unable to receive report.",
    );
  }

  async function copyShare() {
    const url = window.location.href.split("?")[0];
    if (!details) return;
    const { tombstone, team } = details;
    const hook = shareHooks.tombstone[0];
    const text = formatTombstoneShareText({
      teamName: team.name,
      causeOfDeath: tombstone.causeOfDeath,
      epitaph: tombstone.epitaph,
      hook,
      url,
    });
    const result = await shareTombstone({
      title: `${team.name} Tombstone`,
      text,
      url,
    });

    if (result === "shared") {
      setManualShareText("");
      setMessage("Share sheet opened. Bring more fans to the funeral.");
    } else if (result === "copied") {
      setManualShareText("");
      setMessage("Share hook copied. Bring more fans to the funeral.");
    } else {
      setManualShareText(result.text);
      setMessage("Sharing needs a manual pass in this browser. Copy the text below.");
    }
  }

  async function downloadPoster() {
    if (!posterRef.current || downloadingPoster) return;
    setDownloadingPoster(true);
    setMessage("Preparing poster...");
    try {
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: window.innerWidth < 640 ? 1.35 : 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `${team.slug}-world-cup-funeral-home-poster.png`;
      link.href = dataUrl;
      link.click();
      setMessage("Poster downloaded.");
    } catch {
      setMessage("Poster download failed. Please try again.");
    } finally {
      setDownloadingPoster(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-6xl px-4 py-10">Loading tombstone...</main>;
  }

  if (!details) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-4xl font-semibold">Tombstone not found</h1>
        <p className="mt-4 text-[var(--muted)]">The paperwork may have been lost in extra time.</p>
        <LinkButton className="mt-8" href="/">
          Back to Team Wall
        </LinkButton>
      </main>
    );
  }

  const { tombstone, team, deathMatch, tributes } = details;
  const shareHooks = getShareHooks(team.slug);
  const sortedTributes = sortTributesForDisplay(tributes, tributeSortMode);
  const canonicalUrl =
    typeof window === "undefined"
      ? `https://world-cup-funeral-home.tickletickle.space/tombstone/${tombstone.shareSlug}`
      : window.location.href.split("?")[0];

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
      <section>
        <div ref={posterRef} className="rounded-md bg-[#171511] p-8 text-center text-[var(--foreground)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">World Cup Funeral Home</p>
          <div className="realistic-tombstone-scene mt-8">
            <div className="realistic-tombstone">
              <div className="realistic-tombstone-content">
                <img className="realistic-tombstone-flag" src={team.flagUrl} alt={`${team.name} flag`} />
                <p className="engraved-label mt-6">In Loving Memory of</p>
                <h1 className="engraved-name mt-3">{team.name}</h1>
                <div className="engraved-rule" />
                <p className="engraved-label">Cause of Death</p>
                <p className="engraved-copy mt-2 text-xl font-bold">{tombstone.causeOfDeath}</p>
                <p className="engraved-copy mt-7 text-3xl font-semibold leading-10">“{tombstone.epitaph}”</p>
                <p className="engraved-label mt-7">Buried by: {tombstone.buriedBy}</p>
              </div>
            </div>
            <div className="tombstone-base" />
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-sm leading-6 text-[var(--muted)]">{deathMatch.displayText}</p>
          <p className="mt-5 text-lg text-[var(--gold)]">
            {team.flowerCount + team.candleCount + team.incenseCount + team.tributeCount} fans have already paid their respects.
          </p>
          <div className="mx-auto mt-5 max-w-md rounded-sm border border-[var(--gold)]/35 bg-black/25 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
              Pay respects here
            </p>
            <p className="mt-1 break-all font-mono text-xs leading-5 text-[#f6efe1]">
              {canonicalUrl}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button variant="secondary" onClick={() => ritual("flower")}>
            <Flower2 size={17} /> Offer Flowers
          </Button>
          <Button variant="secondary" onClick={() => ritual("candle")}>
            <Flame size={17} /> Light a Candle
          </Button>
          <Button variant="secondary" onClick={() => ritual("incense")}>
            <Sparkles size={17} /> Burn Incense
          </Button>
          <Button onClick={copyShare}>
            <Share2 size={17} /> Share Tombstone
          </Button>
        </div>
        <Button className="mt-3 w-full" variant="secondary" onClick={downloadPoster} disabled={downloadingPoster}>
          <Gift size={17} /> {downloadingPoster ? "Preparing Poster..." : "Download Share Poster"}
        </Button>
        <LinkButton className="mt-3 w-full sm:hidden" href="/create?team=italy">
          Build Your Own Tombstone
        </LinkButton>
        <button
          className="mt-3 text-xs text-[var(--muted)] underline underline-offset-4"
          onClick={() => reportContent("tombstone", tombstone.id)}
        >
          Report this tombstone
        </button>
        {message && <p className="mt-4 rounded-sm border border-white/10 bg-white/5 p-3 text-sm text-[var(--muted)]">{message}</p>}
        {manualShareText && (
          <div className="mt-3 rounded-sm border border-[var(--gold)]/35 bg-[var(--gold)]/10 p-3">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              Share Text
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
            <h2 className="text-xl font-semibold">The tombstone is ready.</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Want to invite other fans to pay their respects?
            </p>
            <div className="mt-4 flex gap-3">
              <Button onClick={copyShare}>Share</Button>
              <Button variant="secondary" onClick={() => setShowShare(false)}>
                Continue Mourning
              </Button>
            </div>
          </div>
        )}

        <div className="stone-panel hidden rounded-md p-5 sm:block">
          <h2 className="text-xl font-semibold">Build your own tombstone</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Send another fallen team to the Funeral Home.
          </p>
          <LinkButton className="mt-4 w-full" href="/create?team=italy">
            Build a Tombstone
          </LinkButton>
        </div>

        <div className="stone-panel rounded-md p-5">
          <h2 className="text-xl font-semibold">This tombstone has received</h2>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <Stat label="Flowers" value={tombstone.flowerCount} />
            <Stat label="Candles" value={tombstone.candleCount} />
            <Stat label="Incense" value={tombstone.incenseCount} />
          </div>
        </div>

        <div className="stone-panel rounded-md p-5">
          <h2 className="text-xl font-semibold">Italy-wide mourning stats</h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Stat label="Tombstones" value={team.tombstoneCount} />
            <Stat label="Flowers" value={team.flowerCount} />
            <Stat label="Candles" value={team.candleCount} />
            <Stat label="Incense" value={team.incenseCount} />
          </div>
        </div>

        <div className="stone-panel rounded-md p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <MessageSquare size={20} /> Leave a Tribute
          </h2>
          <textarea
            className="mt-4 min-h-28 w-full rounded-sm border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-[var(--gold)]"
            maxLength={160}
            placeholder="Write something painful, funny, or emotionally unstable..."
            value={tributeText}
            onChange={(event) => setTributeText(event.target.value)}
          />
          <input
            className="mt-3 w-full rounded-sm border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-[var(--gold)]"
            maxLength={30}
            placeholder="Your name or Anonymous Fan"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
          />
          <p className="mt-2 text-xs text-[var(--muted)]">Keep it about football trauma. Don’t attack real people.</p>
          <Button className="mt-4 w-full" onClick={leaveTribute} disabled={!tributeText.trim() || submittingTribute}>
            {submittingTribute ? "Sending..." : "Leave a Tribute"}
          </Button>
        </div>

        <div className="stone-panel rounded-md p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-xl font-semibold">Tribute Wall</h2>
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
                  {mode === "hot" ? "Hot" : "Newest"}
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
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">By {tribute.authorName}</p>
                    <p className="font-mono text-xs text-[var(--muted)]">Score {tributeScore(tribute)}</p>
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
                      Report
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No tributes yet. Everyone is still staring at the qualification table.</p>
            )}
          </div>
        </div>
      </aside>
    </main>
  );
}
