"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Flame, Menu, X } from "lucide-react";
import { dictionaries, locales, localizePath, type Dictionary, type Locale } from "@/lib/i18n";

export function SiteHeader({
  locale = "en",
  dictionary = dictionaries.en,
}: {
  locale?: Locale;
  dictionary?: Dictionary;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const labels = dictionary.header;

  const mobileLinkClass =
    "block rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--gold)]/50";
  const homeHref = localizePath("/", locale);
  const teamWallHref = localizePath("/#team-wall", locale);
  const feedHref = localizePath("/feed", locale);
  const createHref = localizePath("/create", locale);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#10100e]/88 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href={homeHref}
          className="flex min-w-0 items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em]"
          onClick={() => setMenuOpen(false)}
        >
          <span className="grid size-9 place-items-center rounded-sm border border-[var(--gold)]/60 bg-[var(--stone-light)] text-[var(--gold)]">
            <Flame size={17} />
          </span>
          <span className="truncate">{dictionary.common.siteName}</span>
        </Link>
        <button
          className="grid size-10 place-items-center rounded-sm border border-white/10 bg-white/[0.03] text-[var(--foreground)] transition hover:border-[var(--gold)]/50 sm:hidden"
          type="button"
          aria-label={menuOpen ? labels.closeMenu : labels.openMenu}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] sm:flex">
          <Link className="transition hover:text-[var(--foreground)]" href={teamWallHref}>
            {labels.teamWall}
          </Link>
          <Link className="transition hover:text-[var(--foreground)]" href={feedHref}>
            {labels.feed}
          </Link>
          <div className="flex rounded-sm border border-white/10 bg-black/20 p-1 text-xs">
            {locales.map((item) => (
              <Link
                aria-current={item === locale ? "page" : undefined}
                className={`rounded-sm px-2 py-1 font-semibold uppercase ${
                  item === locale ? "bg-[var(--gold)] text-[#14110d]" : "text-[var(--muted)] hover:text-white"
                }`}
                href={localizePath(pathname, item)}
                key={item}
              >
                {item}
              </Link>
            ))}
          </div>
          <Link
            className="rounded-sm bg-[var(--gold)] px-4 py-2 font-semibold text-[#14110d] transition hover:bg-[#f0cd82]"
            href={createHref}
          >
            {labels.create}
          </Link>
        </nav>
      </div>
      {menuOpen && (
        <nav className="border-t border-white/10 bg-[#10100e]/96 px-4 py-3 sm:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            <Link className={mobileLinkClass} href={teamWallHref} onClick={() => setMenuOpen(false)}>
              {labels.teamWall}
            </Link>
            <Link className={mobileLinkClass} href={feedHref} onClick={() => setMenuOpen(false)}>
              {labels.feed}
            </Link>
            <div className="grid grid-cols-3 gap-2">
              {locales.map((item) => (
                <Link
                  className={`rounded-sm border px-3 py-2 text-center text-xs font-semibold uppercase ${
                    item === locale
                      ? "border-[var(--gold)] bg-[var(--gold)] text-[#14110d]"
                      : "border-white/10 bg-white/[0.03] text-[var(--muted)]"
                  }`}
                  href={localizePath(pathname, item)}
                  key={item}
                  onClick={() => setMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
            </div>
            <Link
              className="block rounded-sm bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[#14110d] transition hover:bg-[#f0cd82]"
              href={createHref}
              onClick={() => setMenuOpen(false)}
            >
              {labels.create}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
