"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  Cigarette,
  CircleCheck,
  History,
  LoaderCircle,
  Shield,
  TriangleAlert,
  Wine,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { refreshPublicData } from "@/app/actions";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import { formatDay } from "@/lib/time";
import type { BackfillResult, Rules } from "@/lib/types";
import { Card, IconBadge, Sticker, buttonPrimary, buttonSecondary, cn } from "@/components/ui";

type Habit = "nutted" | "drank" | "smoked";
type DayState = Record<Habit, boolean> & { skip: boolean };

const HABITS: { key: Habit; label: string; icon: LucideIcon }[] = [
  { key: "nutted", label: "nut", icon: Shield },
  { key: "drank", label: "drink", icon: Wine },
  { key: "smoked", label: "smoke", icon: Cigarette },
];

const CLEAN: DayState = { nutted: false, drank: false, smoked: false, skip: false };
const DAY_MS = 86_400_000;

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

function weekday(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

// Card shown to users who joined after the season started. They can log the
// days before they joined (the server decides which: at most 5, not yet logged).
export function Backfill({
  days,
  joinedDay,
  seasonStart,
  rules,
}: {
  days: string[];
  joinedDay: string;
  seasonStart: string;
  rules: Rules;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<Record<string, DayState>>(() =>
    Object.fromEntries(days.map((d) => [d, { nutted: false, drank: false, smoked: false, skip: false }])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<BackfillResult | null>(null);

  const lateBy = Math.max(1, daysBetween(seasonStart, joinedDay));
  const first = days[0];
  const last = days[days.length - 1];
  const at = (d: string) => state[d] ?? CLEAN;
  const included = days.filter((d) => !at(d).skip);
  const estimate = included.reduce((sum, d) => {
    const s = at(d);
    return sum + (s.nutted ? 0 : rules.no_nut) + (s.drank ? 0 : rules.no_drink) + (s.smoked ? 0 : rules.no_smoke);
  }, 0);

  function toggle(day: string, key: Habit | "skip") {
    setState((cur) => {
      const s = cur[day] ?? CLEAN;
      return { ...cur, [day]: { ...s, [key]: !s[key] } };
    });
  }

  async function save() {
    if (included.length === 0) return;
    setSaving(true);
    setError(null);
    const entries = included.map((d) => ({
      day: d,
      nutted: at(d).nutted,
      drank: at(d).drank,
      smoked: at(d).smoked,
    }));
    const { data, error: rpcErr } = await createClient().rpc("submit_backfill", { p_entries: entries });
    if (rpcErr) {
      setError(friendlyError(rpcErr));
      setSaving(false);
      return;
    }
    setDone(data as unknown as BackfillResult);
    setSaving(false);
    refreshPublicData().finally(() => router.refresh());
  }

  if (done) {
    return (
      <div className="animate-pop mb-4 flex items-center gap-3 rounded-[22px] border-2 border-black bg-lime p-4 text-black hard-ink">
        <CircleCheck className="size-7 shrink-0" strokeWidth={2.6} aria-hidden />
        <p className="text-[15px] font-extrabold">
          caught up. {done.filled} {done.filled === 1 ? "day" : "days"} logged, +{done.points} points.
        </p>
      </div>
    );
  }

  // Nothing left to fill (e.g. saved from another tab).
  if (days.length === 0) return null;

  return (
    <Card pop="amber" className="animate-rise mb-4">
      <div className="flex items-center gap-3">
        <IconBadge icon={History} tone="amber" />
        <Sticker tone="amber" rotate={3}>
          late entry
        </Sticker>
      </div>
      <h2 className="mt-4 text-[28px] leading-[0.95] font-extrabold tracking-tighter">
        you joined {lateBy === 1 ? "a day" : `${lateBy} days`} late.
      </h2>
      <p className="mt-2 text-[15px] font-medium text-muted">
        No stress. You can still log{" "}
        <b className="text-ink">
          {days.length === 1 ? formatDay(first) : `${formatDay(first)} to ${formatDay(last)}`}
        </b>
        . Runs don&apos;t count for past days.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(buttonPrimary.replace("bg-lime", "bg-amber"), "mt-5")}
        >
          <CalendarClock className="size-5" strokeWidth={2.6} aria-hidden />
          fill in my last {days.length} {days.length === 1 ? "day" : "days"}
        </button>
      ) : (
        <>
          <p className="mt-5 rounded-2xl bg-surface-2 px-3 py-2.5 text-sm font-bold">
            Tap anything you <span className="text-pink">did</span> that day. Untapped means clean.
          </p>

          <ul className="mt-3 space-y-2.5">
            {days.map((d) => {
              const s = at(d);
              return (
                <li
                  key={d}
                  className={cn(
                    "rounded-2xl border-2 border-line bg-surface-2 p-3 transition-opacity",
                    s.skip && "opacity-45",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold">
                      <span className="mr-1.5 text-xs font-bold text-faint uppercase">{weekday(d)}</span>
                      {formatDay(d)}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggle(d, "skip")}
                      aria-pressed={s.skip}
                      className="text-xs font-bold text-faint underline underline-offset-4 active:text-ink"
                    >
                      {s.skip ? "include" : "skip"}
                    </button>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    {HABITS.map((h) => {
                      const on = s[h.key];
                      return (
                        <button
                          key={h.key}
                          type="button"
                          disabled={s.skip}
                          onClick={() => toggle(d, h.key)}
                          aria-pressed={on}
                          aria-label={`${h.label} on ${formatDay(d)}: ${on ? "yes" : "no"}`}
                          className={cn(
                            "press flex h-11 items-center justify-center gap-1.5 rounded-xl border-2 text-sm font-extrabold",
                            on
                              ? "border-black bg-pink text-black hard-sm-ink"
                              : "border-line bg-surface text-muted",
                          )}
                        >
                          {on ? (
                            <X className="size-4" strokeWidth={3} aria-hidden />
                          ) : (
                            <h.icon className="size-4" strokeWidth={2.4} aria-hidden />
                          )}
                          {h.label}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex items-baseline justify-between px-1">
            <span className="text-sm font-bold text-muted">
              {included.length} {included.length === 1 ? "day" : "days"}
            </span>
            <span className="text-sm font-bold text-muted">
              <span className="tabular text-2xl font-extrabold text-lime">+{estimate}</span> + streak bonus
            </span>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-2xl border-2 border-black bg-pink p-3 text-sm font-bold text-black"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
            </p>
          )}

          <p className="mt-3 px-1 text-xs font-semibold text-faint">Saved days are locked. No edits later.</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={saving}
              className={cn(buttonSecondary, "w-auto px-5")}
            >
              later
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || included.length === 0}
              className={buttonPrimary}
            >
              {saving ? (
                <LoaderCircle className="size-5 animate-spin" aria-hidden />
              ) : (
                <Check className="size-5" strokeWidth={3} aria-hidden />
              )}
              {saving ? "saving…" : `save ${included.length} ${included.length === 1 ? "day" : "days"}`}
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
