import Link from "next/link";
import { clsx } from "clsx";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren } from "react";

const buttonStyles =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/60 disabled:opacity-50";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={clsx(
        buttonStyles,
        variant === "primary" && "bg-[var(--gold)] text-[#14110d] hover:bg-[#f0cd82]",
        variant === "secondary" &&
          "border border-white/15 bg-white/5 text-[var(--foreground)] hover:bg-white/10",
        variant === "ghost" && "text-[var(--muted)] hover:bg-white/8 hover:text-white",
        variant === "danger" && "bg-[var(--red)] text-white hover:bg-[#b73d3d]",
        className,
      )}
      {...props}
    />
  );
}

export function LinkButton({
  className,
  variant = "primary",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link
      className={clsx(
        buttonStyles,
        variant === "primary" && "bg-[var(--gold)] text-[#14110d] hover:bg-[#f0cd82]",
        variant === "secondary" &&
          "border border-white/15 bg-white/5 text-[var(--foreground)] hover:bg-white/10",
        variant === "ghost" && "text-[var(--muted)] hover:bg-white/8 hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function Section({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <section
      className={clsx("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-xl font-semibold text-[var(--foreground)]">{value.toLocaleString()}</div>
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</div>
    </div>
  );
}
