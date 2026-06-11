import { Coffee, Database, Flame, Server, Share2 } from "lucide-react";
import { siteName } from "@/lib/seo";
import { dictionaries, type Dictionary } from "@/lib/i18n";

const paypalUrl = process.env.NEXT_PUBLIC_PAYPAL_ME_URL?.trim();
const supportIcons = [Server, Database, Share2];

export function SiteFooter({
  dictionary = dictionaries.en,
}: {
  dictionary?: Dictionary;
}) {
  const labels = dictionary.footer;

  return (
    <footer className="mt-auto border-t border-white/10 bg-[#10100e]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="stone-panel relative overflow-hidden rounded-md p-5 sm:p-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--gold)] via-white/60 to-[var(--red)]" />
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
                <span className="grid size-9 place-items-center rounded-sm border border-[var(--gold)]/50 bg-[var(--stone-light)]">
                  <Flame size={16} />
                </span>
                {labels.eyebrow}
              </div>
              <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl">
                {labels.title}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
                {labels.body}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:min-w-72">
              {paypalUrl ? (
                <a
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[var(--gold)] px-5 py-3 text-base font-semibold text-[#14110d] transition hover:bg-[#f0cd82] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/60"
                  href={paypalUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Coffee size={18} />
                  {labels.paypal}
                </a>
              ) : (
                <button
                  className="inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-sm border border-[var(--gold)]/40 bg-[var(--gold)]/12 px-5 py-3 text-base font-semibold text-[var(--gold)] opacity-90"
                  disabled
                  type="button"
                >
                  <Coffee size={18} />
                  {labels.paypalSoon}
                </button>
              )}
              <p className="text-center text-xs text-[var(--muted)] lg:text-left">
                {labels.supportNote}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
            {labels.supportItems.map((label, index) => {
              const Icon = supportIcons[index] ?? Server;
              return (
                <div
                  className="flex items-center gap-3 rounded-sm border border-white/10 bg-black/20 px-3 py-3 text-sm text-[var(--muted)]"
                  key={label}
                >
                  <Icon className="shrink-0 text-[var(--gold)]" size={16} />
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-2 text-xs text-[var(--muted)] sm:flex-row">
          <span>{siteName}</span>
          <span>{labels.built}</span>
        </div>
      </div>
    </footer>
  );
}
