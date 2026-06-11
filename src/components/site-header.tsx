"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Menu, X } from "lucide-react";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const mobileLinkClass =
    "block rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--gold)]/50";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#10100e]/88 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em]"
          onClick={() => setMenuOpen(false)}
        >
          <span className="grid size-9 place-items-center rounded-sm border border-[var(--gold)]/60 bg-[var(--stone-light)] text-[var(--gold)]">
            <Flame size={17} />
          </span>
          <span className="truncate">World Cup Funeral Home</span>
        </Link>
        <button
          className="grid size-10 place-items-center rounded-sm border border-white/10 bg-white/[0.03] text-[var(--foreground)] transition hover:border-[var(--gold)]/50 sm:hidden"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
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
      {menuOpen && (
        <nav className="border-t border-white/10 bg-[#10100e]/96 px-4 py-3 sm:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            <Link className={mobileLinkClass} href="/#team-wall" onClick={() => setMenuOpen(false)}>
              Team Wall
            </Link>
            <Link className={mobileLinkClass} href="/feed" onClick={() => setMenuOpen(false)}>
              Latest Burials
            </Link>
            <Link
              className="block rounded-sm bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[#14110d] transition hover:bg-[#f0cd82]"
              href="/create?team=italy"
              onClick={() => setMenuOpen(false)}
            >
              Build a Tombstone
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
