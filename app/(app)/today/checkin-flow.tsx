"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Cigarette,
  CircleCheck,
  Clapperboard,
  Clock,
  Flame,
  Footprints,
  Heart,
  Hourglass,
  ImageUp,
  LoaderCircle,
  Lock,
  Moon,
  PartyPopper,
  RefreshCw,
  Shield,
  Skull,
  Sparkles,
  Trophy,
  TriangleAlert,
  Wine,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { refreshPublicData } from "@/app/actions";
import { compressImage } from "@/lib/compress-image";
import { MAX_UPLOAD_BYTES, RUN_BUCKET } from "@/lib/config";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import { formatDay, formatIstTime } from "@/lib/time";
import type {
  AppStatus,
  CheckinResult,
  DayEntry,
  MySummary,
  Rules,
} from "@/lib/types";
import { CountdownDigits, useServerCountdown } from "@/components/countdown";
import { Backfill } from "./backfill";
import {
  Card,
  IconBadge,
  Stat,
  Sticker,
  buttonPrimary,
  buttonSecondary,
  cn,
  tones,
  type Tone,
} from "@/components/ui";

type Answers = {
  nutted?: boolean;
  drank?: boolean;
  smoked?: boolean;
  ran?: boolean;
};
type QuestionKey = keyof Answers;
type Step = QuestionKey | "upload" | "review";

type Props = {
  userId: string;
  username: string;
  status: AppStatus;
  summary: MySummary | null;
};

export function CheckinFlow({ userId, username, status, summary }: Props) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  const [result, setResult] = useState<CheckinResult | null>(null);
  // Keep the backfill card mounted after it empties so its success note stays.
  const [hadBackfill] = useState(
    () => (summary?.backfill_days?.length ?? 0) > 0,
  );

  const streak = summary?.current_streak ?? 0;

  let body: React.ReactNode;
  if (result) {
    body = (
      <DoneView
        result={result}
        status={status}
        summary={summary}
        onRefresh={refresh}
      />
    );
  } else if (summary?.today) {
    body = (
      <DoneView
        result={entryToResult(summary.today, status.rules)}
        status={status}
        summary={summary}
        onRefresh={refresh}
      />
    );
  } else if (status.season_state === "ended") {
    body = <SeasonEnded summary={summary} />;
  } else if (!status.window_open) {
    body = <LockedView status={status} streak={streak} onOpen={refresh} />;
  } else {
    body = (
      <Questions
        userId={userId}
        status={status}
        streak={streak}
        onSubmitted={(r) => {
          setResult(r);
          refreshPublicData().finally(refresh);
        }}
      />
    );
  }

  return (
    <div className="px-5">
      <header className="flex items-end justify-between gap-3 pt-[calc(env(safe-area-inset-top)+1.75rem)] pb-6">
        <div className="min-w-0">
          <Sticker tone="violet" rotate={-3}>
            {formatDay(status.today)}
          </Sticker>
          <p className="mt-3 truncate text-[28px] leading-none font-extrabold tracking-tight">
            hey @{username}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Pill icon={Flame} tone="amber" value={streak} label="day streak" />
          <Pill
            icon={Zap}
            tone="lime"
            value={summary?.points ?? 0}
            label="points"
          />
        </div>
      </header>
      {summary && hadBackfill && (
        <Backfill
          days={summary.backfill_days}
          joinedDay={summary.joined_day}
          seasonStart={status.season_start}
          rules={status.rules}
        />
      )}
      {body}
    </div>
  );
}

function Pill({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: LucideIcon;
  tone: Tone;
  value: number;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex h-8 items-center gap-1 rounded-full border-2 border-black px-2.5 hard-sm-ink",
        tones[tone].solid,
      )}
      aria-label={`${value} ${label}`}
    >
      <Icon className="size-4" strokeWidth={2.6} aria-hidden />
      <span className="tabular font-mono text-sm font-bold">{value}</span>
    </div>
  );
}

/* ---------------- locked (before 9:30 PM) ---------------- */

function LockedView({
  status,
  streak,
  onOpen,
}: {
  status: AppStatus;
  streak: number;
  onOpen: () => void;
}) {
  const target = status.next_opens_at;
  const remaining = useServerCountdown(target, status.now, onOpen);
  const upcoming = status.season_state === "upcoming";

  return (
    <div className="animate-rise space-y-4">
      <Card
        pop="amber"
        className="dots relative overflow-hidden px-4 pt-8 pb-7 text-center"
      >
        <Moon
          className="animate-float absolute top-4 left-5 size-9 fill-amber text-amber"
          aria-hidden
        />
        <Sparkles
          className="animate-float absolute top-6 right-6 size-6 text-pink [animation-delay:1.5s]"
          aria-hidden
        />
        <Sticker tone="amber" rotate={-4} className="mt-6">
          <Lock className="size-3" aria-hidden /> locked rn
        </Sticker>
        <h1 className="mt-4 text-[34px] leading-[0.95] font-extrabold tracking-tighter">
          {upcoming ? "the season drops soon." : "not yet, bestie."}
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-[15px] font-medium text-muted">
          {upcoming
            ? `First check-in is ${formatDay(status.season_start)} at 9:30 PM IST. Get ready.`
            : "Go live your day. At 9:30 PM you spill all of it."}
        </p>
        <div className="mt-7">
          <CountdownDigits ms={remaining} />
        </div>
        {target && (
          <p className="mt-5 text-xs font-semibold text-faint">
            opens {formatIstTime(target)} IST · closes 11:59 PM IST
          </p>
        )}
      </Card>

      {streak > 0 && (
        <div className="flex items-center gap-4 rounded-[26px] border-2 border-black bg-orange p-4 text-black hard-ink">
          <Flame
            className="animate-wiggle size-10 shrink-0 fill-black/20"
            strokeWidth={2.4}
            aria-hidden
          />
          <div>
            <p className="text-lg leading-tight font-extrabold">
              {streak} {streak === 1 ? "day" : "days"} clean. you&apos;re
              cooking.
            </p>
            <p className="text-sm font-semibold opacity-75">
              Check in tonight to keep it alive.
            </p>
          </div>
        </div>
      )}

      <Card>
        <p className="mb-3 text-xs font-extrabold tracking-widest text-faint uppercase">
          tonight&apos;s quiz
        </p>
        <ul className="space-y-2">
          {QUESTIONS.map((q, i) => (
            <li
              key={q.key}
              className="flex items-center gap-3 rounded-2xl bg-surface-2 p-2.5"
            >
              <IconBadge icon={q.icon} tone={q.tone} size="sm" tilt={false} />
              <span className="flex-1 text-[15px] font-bold">{q.title}</span>
              <span className="font-mono text-xs text-faint">0{i + 1}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ---------------- questions ---------------- */

const QUESTIONS: {
  key: QuestionKey;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  yes: string;
  no: string;
  good: boolean; // the answer that earns points
  points: (r: Rules) => number;
}[] = [
  {
    key: "nutted",
    icon: Shield,
    tone: "lime",
    title: "Iniku Adichiya? Be honest.",
    yes: "yeah…",
    no: "nope",
    good: false,
    points: (r) => r.no_nut,
  },
  {
    key: "drank",
    icon: Wine,
    tone: "violet",
    title: "Iniku Kudichiya? Be honest.",
    yes: "had a few",
    no: "stayed dry",
    good: false,
    points: (r) => r.no_drink,
  },
  {
    key: "smoked",
    icon: Cigarette,
    tone: "pink",
    title: "Iniku Dum iluthiya? Be honest.",
    yes: "yeah",
    no: "nah, clean",
    good: false,
    points: (r) => r.no_smoke,
  },
  {
    key: "ran",
    icon: Footprints,
    tone: "cyan",
    title: "Did you touch grass? (go for a run)",
    yes: "ran it",
    no: "not today",
    good: true,
    points: (r) => r.run,
  },
];

type Shot = {
  blob: Blob;
  type: string;
  url: string;
  size: number;
  uploadedPath?: string;
};

function Questions({
  userId,
  status,
  streak,
  onSubmitted,
}: {
  userId: string;
  status: AppStatus;
  streak: number;
  onSubmitted: (r: CheckinResult) => void;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [history, setHistory] = useState<Step[]>(["nutted"]);
  const [shot, setShot] = useState<Shot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);

  const onClose = useCallback(() => setClosed(true), []);
  const remaining = useServerCountdown(status.closes_at, status.now, onClose);

  const step = history[history.length - 1];
  const go = (s: Step) => setHistory((h) => [...h, s]);
  const back = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));

  const shotUrl = shot?.url;
  useEffect(() => {
    return () => {
      if (shotUrl) URL.revokeObjectURL(shotUrl);
    };
  }, [shotUrl]);

  function answer(key: QuestionKey, value: boolean) {
    setAnswers((a) => ({ ...a, [key]: value }));
    const order: QuestionKey[] = ["nutted", "drank", "smoked", "ran"];
    const i = order.indexOf(key);
    if (key === "ran") go(value ? "upload" : "review");
    else go(order[i + 1]);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    try {
      let path: string | undefined;
      if (answers.ran) {
        if (!shot) throw new Error("SCREENSHOT_REQUIRED");
        path = shot.uploadedPath;
        if (!path) {
          const ext = shot.type === "image/webp" ? "webp" : "jpg";
          path = `${userId}/${status.today}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from(RUN_BUCKET)
            .upload(path, shot.blob, {
              contentType: shot.type,
              upsert: false,
              cacheControl: "31536000",
            });
          if (upErr) throw upErr;
          setShot({ ...shot, uploadedPath: path });
        }
      }
      const { data, error: rpcErr } = await supabase.rpc("submit_checkin", {
        p_nutted: answers.nutted!,
        p_drank: answers.drank!,
        p_smoked: answers.smoked!,
        p_ran: answers.ran!,
        p_screenshot_path: path,
      });
      if (rpcErr) throw rpcErr;
      onSubmitted(data as unknown as CheckinResult);
    } catch (e) {
      const msg = friendlyError(e);
      setError(msg);
      if (msg.includes("already") || msg.includes("9:30 PM")) router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (closed) {
    return (
      <Card pop="pink" className="animate-pop text-center">
        <span className="inline-flex">
          <IconBadge icon={Skull} tone="pink" size="lg" />
        </span>
        <h1 className="mt-3 text-[30px] leading-none font-extrabold tracking-tighter">
          window closed. oop.
        </h1>
        <p className="mt-3 text-sm font-medium text-muted">
          Check-ins close at 11:59 PM IST. Run it back at 9:30 PM.
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className={cn(buttonSecondary, "mt-6")}
        >
          <RefreshCw className="size-4" aria-hidden /> Refresh
        </button>
      </Card>
    );
  }

  const qIndex = QUESTIONS.findIndex((q) => q.key === step);
  const progress = step === "review" ? 5 : step === "upload" ? 4.5 : qIndex + 1;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          disabled={history.length === 1}
          aria-label="Back"
          className="press inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-surface hard-sm-ink disabled:invisible"
        >
          <ArrowLeft className="size-5" strokeWidth={2.6} aria-hidden />
        </button>
        <div
          className="flex h-4 flex-1 gap-1 rounded-full border-2 border-ink p-0.5"
          aria-hidden
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={cn(
                "flex-1 rounded-full transition-colors duration-300",
                i <= progress ? "bg-lime" : "bg-transparent",
              )}
            />
          ))}
        </div>
        <span
          className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-amber"
          aria-label="Time left tonight"
        >
          <Clock className="size-3.5" aria-hidden />
          <CountdownDigits ms={remaining} size="sm" />
        </span>
      </div>

      {qIndex >= 0 && (
        <QuestionCard
          key={step}
          q={QUESTIONS[qIndex]}
          index={qIndex}
          rules={status.rules}
          streak={streak}
          value={answers[QUESTIONS[qIndex].key]}
          onAnswer={(v) => answer(QUESTIONS[qIndex].key, v)}
        />
      )}

      {step === "upload" && (
        <UploadStep
          shot={shot}
          onShot={(s) => {
            setShot(s);
            setError(null);
          }}
          onError={setError}
          onNext={() => go("review")}
        />
      )}

      {step === "review" && (
        <Review
          answers={answers}
          rules={status.rules}
          streak={streak}
          shot={shot}
          submitting={submitting}
          onSubmit={submit}
        />
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-black bg-pink p-3.5 text-sm font-bold text-black hard-sm-ink"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />{" "}
          {error}
        </p>
      )}
    </div>
  );
}

function QuestionCard({
  q,
  index,
  rules,
  streak,
  value,
  onAnswer,
}: {
  q: (typeof QUESTIONS)[number];
  index: number;
  rules: Rules;
  streak: number;
  value: boolean | undefined;
  onAnswer: (v: boolean) => void;
}) {
  const pts = q.points(rules);
  const bonus =
    q.key === "nutted"
      ? Math.min(streak * rules.streak_bonus_per_day, rules.streak_bonus_cap)
      : 0;
  const stake =
    q.key === "nutted"
      ? `"nope" bags +${pts}${bonus ? ` plus a +${bonus} streak bonus` : ""}. "yeah" resets your streak to 0.`
      : q.key === "ran"
        ? `"ran it" bags +${pts}. You'll drop a screenshot next.`
        : `"${q.no}" bags +${pts}.`;

  return (
    <div className="animate-rise">
      <Card
        pop={q.tone}
        className="relative flex min-h-80 flex-col overflow-hidden"
      >
        <q.icon
          className={cn(
            "pointer-events-none absolute -right-6 -bottom-8 size-44 -rotate-12 opacity-10",
            tones[q.tone].text,
          )}
          strokeWidth={2}
          aria-hidden
        />
        <div className="flex items-center justify-between">
          <IconBadge icon={q.icon} tone={q.tone} size="lg" />
          <span className="font-mono text-sm font-bold text-faint">
            Q{index + 1}
            <span className="opacity-50">/4</span>
          </span>
        </div>
        <h1 className="relative mt-7 text-[36px] leading-[0.95] font-extrabold tracking-tighter">
          {q.title}
        </h1>
        <p
          className={cn(
            "relative mt-4 text-[15px] font-semibold",
            tones[q.tone].text,
          )}
        >
          {stake}
        </p>
        <p className="relative mt-auto pt-6 text-xs font-semibold text-faint">
          lying only cheats you. just saying.
        </p>
      </Card>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[true, false].map((v) => {
          const good = v === q.good;
          const selected = value === v;
          return (
            <button
              key={String(v)}
              type="button"
              onClick={() => onAnswer(v)}
              className={cn(
                "press h-18 rounded-2xl border-2 text-lg font-extrabold",
                selected
                  ? good
                    ? "border-black bg-lime text-black hard-ink"
                    : "border-black bg-pink text-black hard-ink"
                  : "border-ink bg-surface-2 text-ink hard-sm-ink",
              )}
            >
              {v ? q.yes : q.no}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UploadStep({
  shot,
  onShot,
  onError,
  onNext,
}: {
  shot: Shot | null;
  onShot: (s: Shot | null) => void;
  onError: (m: string | null) => void;
  onNext: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    onError(null);
    try {
      const out = await compressImage(file, MAX_UPLOAD_BYTES);
      onShot({
        blob: out.blob,
        type: out.type,
        size: out.blob.size,
        url: URL.createObjectURL(out.blob),
      });
    } catch (e) {
      onError(friendlyError(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="animate-rise">
      <Card pop="cyan">
        <div className="flex items-center gap-3">
          <IconBadge icon={Camera} tone="cyan" size="lg" />
          <Sticker tone="cyan" rotate={3}>
            ≤{MAX_UPLOAD_BYTES / 1024}kb · auto-shrunk
          </Sticker>
        </div>
        <h1 className="mt-5 text-[34px] leading-[0.95] font-extrabold tracking-tighter">
          pics or it didn&apos;t happen.
        </h1>
        <p className="mt-2 text-[15px] font-medium text-muted">
          Screenshot from Strava, Adidas Running, Nike Run Club, whatever you
          use.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          id="run-shot"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        {shot ? (
          <div className="mt-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shot.url}
              alt="Your run screenshot"
              className="max-h-80 w-full rotate-1 rounded-2xl border-2 border-ink bg-black object-contain hard-sm-ink"
            />
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-bold text-lime">
                <CircleCheck className="size-4" aria-hidden /> squished to{" "}
                {Math.round(shot.size / 1024)} KB
              </span>
              <label
                htmlFor="run-shot"
                className="cursor-pointer font-bold text-muted underline underline-offset-4 active:text-ink"
              >
                swap it
              </label>
            </div>
          </div>
        ) : (
          <label
            htmlFor="run-shot"
            className={cn(
              "mt-5 flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cyan bg-cyan/8 transition active:bg-cyan/15",
              busy && "pointer-events-none",
            )}
          >
            {busy ? (
              <>
                <LoaderCircle
                  className="size-8 animate-spin text-cyan"
                  aria-hidden
                />
                <span className="text-sm font-bold text-muted">
                  squishing it on your phone…
                </span>
              </>
            ) : (
              <>
                <ImageUp
                  className="size-8 text-cyan"
                  strokeWidth={2.4}
                  aria-hidden
                />
                <span className="text-base font-extrabold">
                  tap to drop your screenshot
                </span>
                <span className="text-xs font-semibold text-faint">
                  shrunk to 100 KB or less before upload
                </span>
              </>
            )}
          </label>
        )}

        <p className="mt-4 flex items-start gap-2 text-xs font-semibold text-faint">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Run pics are public. Crop out maps that show where you live, fr.
        </p>
      </Card>

      <button
        type="button"
        onClick={onNext}
        disabled={!shot || busy}
        className={cn(buttonPrimary, "mt-4")}
      >
        next <ArrowRight className="size-5" strokeWidth={2.6} aria-hidden />
      </button>
    </div>
  );
}

function computeBreakdown(answers: Answers, rules: Rules, streak: number) {
  return {
    no_nut: answers.nutted ? 0 : rules.no_nut,
    run: answers.ran ? rules.run : 0,
    no_drink: answers.drank ? 0 : rules.no_drink,
    no_smoke: answers.smoked ? 0 : rules.no_smoke,
    streak_bonus: answers.nutted
      ? 0
      : Math.min(streak * rules.streak_bonus_per_day, rules.streak_bonus_cap),
  };
}

function Review({
  answers,
  rules,
  streak,
  shot,
  submitting,
  onSubmit,
}: {
  answers: Answers;
  rules: Rules;
  streak: number;
  shot: Shot | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const b = computeBreakdown(answers, rules, streak);
  const total = Object.values(b).reduce((s, n) => s + n, 0);

  return (
    <div className="animate-rise">
      <Card pop="lime" className="dots">
        <div className="flex items-center justify-between">
          <Sticker tone="lime" rotate={-3}>
            tonight&apos;s haul
          </Sticker>
          <IconBadge icon={Zap} tone="lime" size="sm" />
        </div>
        <p className="tabular mt-4 text-[84px] leading-[0.85] font-extrabold tracking-tighter text-lime">
          +{total}
        </p>
        <Breakdown b={b} className="mt-6" />
        {shot && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-2 p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shot.url}
              alt=""
              className="size-12 rounded-xl border-2 border-ink object-cover"
            />
            <span className="text-sm font-semibold text-muted">
              run receipt, {Math.round(shot.size / 1024)} KB
            </span>
          </div>
        )}
      </Card>
      <p className="mt-4 px-1 text-xs font-semibold text-faint">
        Once you send it, tonight is locked. No edits, no take-backs.
      </p>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className={cn(buttonPrimary, "mt-3")}
      >
        {submitting ? (
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
        ) : (
          <Lock className="size-5" strokeWidth={2.8} aria-hidden />
        )}
        {submitting ? "sending…" : "lock it in"}
      </button>
    </div>
  );
}

function Breakdown({
  b,
  className,
}: {
  b: CheckinResult["breakdown"];
  className?: string;
}) {
  const rows: { label: string; value: number; icon: LucideIcon }[] = [
    { label: "no nut", value: b.no_nut, icon: Shield },
    { label: "streak bonus", value: b.streak_bonus, icon: Flame },
    { label: "run", value: b.run, icon: Footprints },
    { label: "no alcohol", value: b.no_drink, icon: Wine },
    { label: "no smoking", value: b.no_smoke, icon: Cigarette },
  ];
  return (
    <ul className={cn("space-y-1.5", className)}>
      {rows.map((r) => (
        <li
          key={r.label}
          className={cn(
            "flex items-center gap-3 rounded-xl px-2 py-1.5 text-[15px] font-bold",
            r.value === 0
              ? "text-faint line-through decoration-2"
              : "bg-surface-2",
          )}
        >
          <r.icon
            className={cn("size-4", r.value === 0 && "opacity-40")}
            strokeWidth={2.6}
            aria-hidden
          />
          <span className="flex-1">{r.label}</span>
          <span className="tabular font-mono">+{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- done ---------------- */

function entryToResult(e: DayEntry, rules: Rules): CheckinResult {
  const base = {
    no_nut: e.nutted ? 0 : rules.no_nut,
    run: e.ran ? rules.run : 0,
    no_drink: e.drank ? 0 : rules.no_drink,
    no_smoke: e.smoked ? 0 : rules.no_smoke,
  };
  const sum = base.no_nut + base.run + base.no_drink + base.no_smoke;
  return {
    day: e.day,
    points: e.points,
    streak: e.streak,
    breakdown: { ...base, streak_bonus: Math.max(0, e.points - sum) },
  };
}

const CONFETTI: { icon: LucideIcon; c: string }[] = [
  { icon: Sparkles, c: "top-4 left-5 text-amber" },
  { icon: PartyPopper, c: "top-10 right-6 text-pink [animation-delay:0.8s]" },
  { icon: Zap, c: "bottom-8 left-8 text-cyan [animation-delay:1.6s]" },
  { icon: Heart, c: "bottom-6 right-10 fill-lime text-lime [animation-delay:2.2s]" },
];

function DoneView({
  result,
  status,
  summary,
  onRefresh,
}: {
  result: CheckinResult;
  status: AppStatus;
  summary: MySummary | null;
  onRefresh: () => void;
}) {
  const remaining = useServerCountdown(
    status.next_opens_at,
    status.now,
    onRefresh,
  );
  const clean = result.breakdown.no_nut > 0;

  return (
    <div className="space-y-4">
      <Card
        pop={clean ? "lime" : "pink"}
        className="animate-pop dots relative overflow-hidden px-5 py-9 text-center"
      >
        {clean &&
          CONFETTI.map((c, i) => (
            <c.icon
              key={i}
              className={cn("animate-float absolute size-6", c.c)}
              strokeWidth={2.4}
              aria-hidden
            />
          ))}
        <Sticker tone={clean ? "lime" : "pink"} rotate={-4}>
          {clean ? "W night" : "it happens"}
        </Sticker>
        <h1 className="mt-4 text-[38px] leading-[0.92] font-extrabold tracking-tighter">
          {clean ? "locked in." : "reset arc."}
        </h1>
        <p className="mt-2 text-sm font-semibold text-muted">
          {clean
            ? "you held the line. absolute cinema."
            : "tomorrow is a whole new episode."}
        </p>
        <p
          className={cn(
            "tabular mt-6 text-[96px] leading-[0.8] font-extrabold tracking-tighter",
            clean ? "text-lime" : "text-pink",
          )}
        >
          +{result.points}
        </p>
        <p className="mt-2 text-xs font-extrabold tracking-widest text-faint uppercase">
          points tonight
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          icon={Flame}
          tone="amber"
          label="Day streak"
          value={result.streak}
        />
        <Stat
          icon={Trophy}
          tone="cyan"
          label={summary ? `of ${summary.total_users} players` : "Rank"}
          value={summary ? `#${summary.rank}` : "-"}
        />
      </div>

      <Card>
        <p className="mb-3 text-xs font-extrabold tracking-widest text-faint uppercase">
          the receipt
        </p>
        <Breakdown b={result.breakdown} />
      </Card>

      <Card className="flex items-center gap-4">
        <IconBadge icon={Hourglass} tone="amber" size="sm" />
        <div className="flex-1">
          {status.next_opens_at ? (
            <>
              <p className="text-xs font-extrabold tracking-widest text-faint uppercase">
                next drop in
              </p>
              <p className="text-xl font-extrabold text-amber">
                <CountdownDigits ms={remaining} size="sm" />
              </p>
            </>
          ) : (
            <p className="text-sm font-bold text-muted">
              That was the last night of the season. GG.
            </p>
          )}
        </div>
        <Link
          href="/leaderboard"
          className="press inline-flex items-center gap-1 rounded-full border-2 border-black bg-amber px-4 py-2 text-sm font-extrabold text-black hard-sm-ink"
        >
          the board <ArrowRight className="size-4" strokeWidth={2.8} aria-hidden />
        </Link>
      </Card>
    </div>
  );
}

function SeasonEnded({ summary }: { summary: MySummary | null }) {
  return (
    <div className="space-y-4">
      <Card pop="violet" className="dots py-9 text-center">
        <span className="animate-wiggle inline-flex">
          <IconBadge icon={Clapperboard} tone="violet" size="lg" />
        </span>
        <h1 className="mt-4 text-[38px] leading-[0.92] font-extrabold tracking-tighter">
          that&apos;s a wrap.
        </h1>
        <p className="mt-2 text-[15px] font-medium text-muted">
          Check-ins are closed. Here&apos;s how you finished.
        </p>
      </Card>
      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <Stat
            icon={Trophy}
            tone="lime"
            label="Final rank"
            value={`#${summary.rank}`}
          />
          <Stat
            icon={Check}
            tone="cyan"
            label="Total points"
            value={summary.points}
          />
          <Stat
            icon={Shield}
            tone="violet"
            label="Clean days"
            value={summary.no_nut_days}
          />
          <Stat
            icon={Footprints}
            tone="pink"
            label="Runs"
            value={summary.runs}
          />
        </div>
      )}
      <Link href="/leaderboard" className={buttonPrimary}>
        <Trophy className="size-5" strokeWidth={2.6} aria-hidden /> see the final board
      </Link>
    </div>
  );
}
