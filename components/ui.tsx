import { Flame, Sparkle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// Literal class names per tone so Tailwind can see them.
export const tones = {
  lime: { solid: "bg-lime text-black", soft: "bg-lime/12 text-lime", text: "text-lime", border: "border-lime", hard: "hard-lime", hardLg: "hard-lg-lime" },
  cyan: { solid: "bg-cyan text-black", soft: "bg-cyan/12 text-cyan", text: "text-cyan", border: "border-cyan", hard: "hard-cyan", hardLg: "hard-lg-cyan" },
  amber: { solid: "bg-amber text-black", soft: "bg-amber/12 text-amber", text: "text-amber", border: "border-amber", hard: "hard-amber", hardLg: "hard-lg-amber" },
  pink: { solid: "bg-pink text-black", soft: "bg-pink/12 text-pink", text: "text-pink", border: "border-pink", hard: "hard-pink", hardLg: "hard-lg-pink" },
  violet: { solid: "bg-violet text-black", soft: "bg-violet/15 text-violet", text: "text-violet", border: "border-violet", hard: "hard-violet", hardLg: "hard-lg-violet" },
  orange: { solid: "bg-orange text-black", soft: "bg-orange/12 text-orange", text: "text-orange", border: "border-orange", hard: "hard-orange", hardLg: "hard-lg-orange" },
  muted: { solid: "bg-surface-2 text-ink", soft: "bg-surface-2 text-muted", text: "text-muted", border: "border-line", hard: "hard-line", hardLg: "hard-lg-line" },
} as const;

export type Tone = keyof typeof tones;

export function PageHeader({
  eyebrow,
  title,
  right,
  tone = "lime",
}: {
  eyebrow?: string;
  title: ReactNode;
  right?: ReactNode;
  tone?: Tone;
}) {
  return (
    <header className="flex items-end justify-between gap-4 px-5 pt-[calc(env(safe-area-inset-top)+1.75rem)] pb-5">
      <div className="min-w-0">
        {eyebrow && (
          <Sticker tone={tone} rotate={-3}>
            {eyebrow}
          </Sticker>
        )}
        <h1 className="mt-3 truncate text-[44px] leading-[0.95] font-extrabold tracking-tighter">{title}</h1>
      </div>
      {right}
    </header>
  );
}

export function Card({
  className,
  children,
  pop,
}: {
  className?: string;
  children: ReactNode;
  /** Adds a hard offset shadow in this color. */
  pop?: Tone;
}) {
  return (
    <div
      className={cn(
        "rounded-[26px] border-2 bg-surface p-5",
        pop ? cn("border-ink", tones[pop].hard) : "border-line",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function IconBadge({
  icon: Icon,
  tone = "lime",
  size = "md",
  tilt = true,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  tilt?: boolean;
}) {
  const box =
    size === "lg" ? "size-16 rounded-[20px]" : size === "sm" ? "size-9 rounded-xl" : "size-12 rounded-2xl";
  const icon = size === "lg" ? "size-8" : size === "sm" ? "size-4.5" : "size-6";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border-2 border-black",
        box,
        tones[tone].solid,
        tilt && "-rotate-6",
        size === "lg" && "hard-ink",
      )}
    >
      <Icon className={icon} strokeWidth={2.6} aria-hidden />
    </span>
  );
}

export function Logo() {
  return (
    <span className="inline-flex size-9 -rotate-6 items-center justify-center rounded-xl border-2 border-black bg-lime text-black hard-sm-ink">
      <Flame className="size-5 fill-black/15" strokeWidth={2.8} aria-hidden />
    </span>
  );
}

export function Sticker({
  tone = "lime",
  rotate = 0,
  className,
  children,
}: {
  tone?: Tone;
  rotate?: number;
  className?: string;
  children: ReactNode;
}) {
  const style: CSSProperties | undefined = rotate ? { rotate: `${rotate}deg` } : undefined;
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 border-black px-3 py-1 text-[11px] font-extrabold tracking-wide uppercase hard-sm-ink",
        tones[tone].solid,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  icon: Icon,
  tone = "lime",
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-[22px] border-2 border-black p-4 hard-ink", tones[tone].solid)}>
      <Icon className="absolute -right-2 -bottom-2 size-16 opacity-15" strokeWidth={2.5} aria-hidden />
      <p className="tabular text-[34px] leading-none font-extrabold tracking-tight">{value}</p>
      <p className="mt-1.5 truncate text-xs font-bold uppercase opacity-75">{label}</p>
    </div>
  );
}

export function Marquee({ items, tone = "lime", className }: { items: ReactNode[]; tone?: Tone; className?: string }) {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center gap-6 pr-6" aria-hidden={hidden || undefined}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-6 text-sm font-extrabold whitespace-nowrap uppercase">
          {it}
          <Sparkle className="size-4 fill-current" aria-hidden />
        </span>
      ))}
    </div>
  );
  return (
    <div className={cn("overflow-hidden border-y-2 border-black py-2.5", tones[tone].solid, className)}>
      <div className="animate-marquee flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[26px] border-2 border-dashed border-line bg-surface/60", className)} />;
}

export const buttonPrimary =
  "press inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-black bg-lime px-6 text-[17px] font-extrabold text-black hard-ink disabled:opacity-40 disabled:shadow-none";

export const buttonSecondary =
  "press inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-surface-2 px-6 text-base font-bold text-ink hard-sm-ink disabled:opacity-40 disabled:shadow-none";
