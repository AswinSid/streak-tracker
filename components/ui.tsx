import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function PageHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-4 px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-[28px] leading-tight font-semibold tracking-tight">{title}</h1>
      </div>
      {right}
    </header>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-3xl border border-line bg-surface p-5", className)}>{children}</div>
  );
}

const tones = {
  lime: "text-lime bg-lime/10",
  cyan: "text-cyan bg-cyan/10",
  amber: "text-amber bg-amber/10",
  pink: "text-pink bg-pink/10",
  violet: "text-violet bg-violet/15",
  muted: "text-muted bg-surface-2",
} as const;

export type Tone = keyof typeof tones;

export function IconBadge({
  icon: Icon,
  tone = "lime",
  size = "md",
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "size-14 rounded-2xl" : size === "sm" ? "size-8 rounded-xl" : "size-11 rounded-2xl";
  const icon = size === "lg" ? "size-7" : size === "sm" ? "size-4" : "size-5";
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", box, tones[tone])}>
      <Icon className={icon} strokeWidth={2.2} aria-hidden />
    </span>
  );
}

export function Stat({
  label,
  value,
  icon,
  tone = "lime",
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
      <IconBadge icon={icon} tone={tone} size="sm" />
      <div className="min-w-0">
        <p className="tabular font-mono text-lg leading-none font-semibold">{value}</p>
        <p className="mt-1 truncate text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-3xl bg-surface", className)} />;
}

export const buttonPrimary =
  "inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-lime px-6 text-base font-semibold text-black transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";

export const buttonSecondary =
  "inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface-2 px-6 text-base font-medium text-ink transition active:scale-[0.98] disabled:opacity-50";
