import Link from "next/link";
import { Flame } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#10100e]/88 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em]">
          <span className="grid size-9 place-items-center rounded-sm border border-[var(--gold)]/60 bg-[var(--stone-light)] text-[var(--gold)]">
            <Flame size={17} />
          </span>
          <span>World Cup Funeral Home</span>
        </Link>
        <Link
          className="rounded-sm bg-[var(--gold)] px-3 py-2 text-xs font-semibold text-[#14110d] transition hover:bg-[#f0cd82] sm:hidden"
          href="/create?team=italy"
        >
          Build
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] sm:flex">
          <Link className="transition hover:text-[var(--foreground)]" href="/#team-wall">
            Team Wall
          </Link>
          <Link className="transition hover:text-[var(--foreground)]" href="/feed">
            Latest Burials
          </Link>
          <Link
            className="rounded-sm bg-[var(--gold)] px-4 py-2 font-semibold text-[#14110d] transition hover:bg-[#f0cd82]"
            href="/create?team=italy"
          >
            Build a Tombstone
          </Link>
        </nav>
      </div>
    </header>
  );
}
