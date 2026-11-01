"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  Cigarette,
  CircleCheck,
  Clock,
  Flame,
  Footprints,
  ImageUp,
  LoaderCircle,
  Lock,
  RefreshCw,
  Shield,
  Trophy,
  TriangleAlert,
  Wine,
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
import {
  Card,
  IconBadge,
  Stat,
  buttonPrimary,
  buttonSecondary,
  cn,
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
      <header className="flex items-center justify-between pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-5">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            {formatDay(status.today)}
          </p>
          <p className="mt-1 text-lg font-semibold">@{username}</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill icon={Flame} tone="amber" value={streak} label="day streak" />
          <Pill
            icon={Trophy}
            tone="lime"
            value={summary?.points ?? 0}
            label="points"
          />
        </div>
      </header>
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
      className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-3"
      aria-label={`${value} ${label}`}
    >
      <Icon
        className={cn("size-4", tone === "amber" ? "text-amber" : "text-lime")}
        aria-hidden
      />
      <span className="tabular font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}

/* ---------------- locked (before 9 PM) ---------------- */

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
    <div className="animate-rise space-y-3">
      <Card className="relative overflow-hidden text-center">
        <div className="pointer-events-none absolute -top-24 left-1/2 size-56 -translate-x-1/2 rounded-full bg-amber/10 blur-3xl" />
        <div className="relative">
          <span className="mx-auto inline-flex">
            <IconBadge icon={Lock} tone="amber" size="lg" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {upcoming ? "The challenge starts soon" : "Check-in opens at 9 PM"}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-[15px] text-muted">
            {upcoming
              ? `First check-in on ${formatDay(status.season_start)} at 9:00 PM IST.`
              : "Live your day first. Tonight you answer for all of it."}
          </p>
          <div className="mt-6">
            <CountdownDigits ms={remaining} />
          </div>
          {target && (
            <p className="mt-4 text-xs text-faint">
              Opens {formatIstTime(target)} IST, closes 11:59 PM IST
            </p>
          )}
        </div>
      </Card>

      {streak > 0 && (
        <Card className="flex items-center gap-4">
          <IconBadge icon={Flame} tone="amber" />
          <div>
            <p className="font-semibold">
              {streak} clean {streak === 1 ? "day" : "days"} in a row
            </p>
            <p className="text-sm text-muted">
              Check in tonight to keep it alive.
            </p>
          </div>
        </Card>
      )}

      <Card>
        <p className="mb-3 text-sm font-medium text-muted">
          Tonight you will answer
        </p>
        <ul className="space-y-2.5">
          {QUESTIONS.map((q) => (
            <li key={q.key} className="flex items-center gap-3">
              <IconBadge icon={q.icon} tone={q.tone} size="sm" />
              <span className="text-[15px]">{q.title}</span>
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
  good: boolean; // the answer that earns points
  points: (r: Rules) => number;
}[] = [
  {
    key: "nutted",
    icon: Shield,
    tone: "lime",
    title: "Did you nut today?",
    good: false,
    points: (r) => r.no_nut,
  },
  {
    key: "drank",
    icon: Wine,
    tone: "violet",
    title: "Did you drink alcohol today?",
    good: false,
    points: (r) => r.no_drink,
  },
  {
    key: "smoked",
    icon: Cigarette,
    tone: "pink",
    title: "Did you smoke today?",
    good: false,
    points: (r) => r.no_smoke,
  },
  {
    key: "ran",
    icon: Footprints,
    tone: "cyan",
    title: "Did you go for a run today?",
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
      if (msg.includes("already") || msg.includes("9:00 PM")) router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (closed) {
    return (
      <Card className="text-center">
        <span className="mx-auto inline-flex">
          <IconBadge icon={Clock} tone="pink" size="lg" />
        </span>
        <h1 className="mt-4 text-xl font-semibold">
          Tonight&apos;s window just closed
        </h1>
        <p className="mt-2 text-sm text-muted">
          Check-ins close at 11:59 PM IST. See you at 9 PM.
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
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          disabled={history.length === 1}
          aria-label="Back"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface transition disabled:opacity-0"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= progress ? "bg-lime" : "bg-line",
              )}
            />
          ))}
        </div>
        <span
          className="flex items-center gap-1 text-xs text-faint"
          aria-label="Time left tonight"
        >
          <Clock className="size-3.5" aria-hidden />
          <span className="tabular font-mono">
            <CountdownDigits ms={remaining} size="sm" />
          </span>
        </span>
      </div>

      {qIndex >= 0 && (
        <QuestionCard
          key={step}
          q={QUESTIONS[qIndex]}
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
          className="mt-4 flex items-start gap-2 rounded-2xl border border-pink/30 bg-pink/10 p-3.5 text-sm text-pink"
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
  rules,
  streak,
  value,
  onAnswer,
}: {
  q: (typeof QUESTIONS)[number];
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
      ? `No earns +${pts}${bonus ? ` and a +${bonus} streak bonus` : ""}. Yes resets your streak.`
      : q.key === "ran"
        ? `Yes earns +${pts}. You will upload a screenshot next.`
        : `No earns +${pts}.`;

  return (
    <div className="animate-rise">
      <Card className="flex min-h-85 flex-col">
        <IconBadge icon={q.icon} tone={q.tone} size="lg" />
        <h1 className="mt-6 text-[30px] leading-tight font-semibold tracking-tight">
          {q.title}
        </h1>
        <p className="mt-3 text-[15px] text-muted">{stake}</p>
        <p className="mt-auto pt-6 text-xs text-faint">
          Be honest. It is your challenge.
        </p>
      </Card>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {[true, false].map((v) => {
          const good = v === q.good;
          const selected = value === v;
          return (
            <button
              key={String(v)}
              type="button"
              onClick={() => onAnswer(v)}
              className={cn(
                "h-18 rounded-2xl border text-lg font-semibold transition active:scale-[0.97]",
                selected
                  ? good
                    ? "border-lime bg-lime text-black"
                    : "border-pink bg-pink text-black"
                  : "border-line bg-surface-2 text-ink",
              )}
            >
              {v ? "Yes" : "No"}
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
      <Card>
        <IconBadge icon={Camera} tone="cyan" size="lg" />
        <h1 className="mt-5 text-[26px] leading-tight font-semibold tracking-tight">
          Show the run
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Screenshot from Strava, Adidas Running, Nike Run Club or any tracker.
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
              className="max-h-80 w-full rounded-2xl border border-line object-contain bg-black"
            />
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-lime">
                <CircleCheck className="size-4" aria-hidden /> Compressed to{" "}
                {Math.round(shot.size / 1024)} KB
              </span>
              <label
                htmlFor="run-shot"
                className="cursor-pointer font-medium text-muted underline-offset-4 active:text-ink"
              >
                Change
              </label>
            </div>
          </div>
        ) : (
          <label
            htmlFor="run-shot"
            className={cn(
              "mt-5 flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface-2 transition active:border-cyan",
              busy && "pointer-events-none",
            )}
          >
            {busy ? (
              <>
                <LoaderCircle
                  className="size-7 animate-spin text-cyan"
                  aria-hidden
                />
                <span className="text-sm text-muted">
                  Compressing on your phone
                </span>
              </>
            ) : (
              <>
                <ImageUp className="size-7 text-cyan" aria-hidden />
                <span className="text-[15px] font-medium">
                  Choose screenshot
                </span>
                <span className="text-xs text-faint">
                  Shrunk to 100 KB or less before upload
                </span>
              </>
            )}
          </label>
        )}

        <p className="mt-4 flex items-start gap-2 text-xs text-faint">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Run screenshots are public. Crop out maps that show your home.
        </p>
      </Card>

      <button
        type="button"
        onClick={onNext}
        disabled={!shot || busy}
        className={cn(buttonPrimary, "mt-3")}
      >
        Continue
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
      <Card>
        <p className="text-sm text-muted">Tonight&apos;s points</p>
        <p className="tabular mt-1 font-mono text-[56px] leading-none font-semibold text-lime">
          +{total}
        </p>
        <Breakdown b={b} className="mt-5" />
        {shot && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-2 p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shot.url}
              alt=""
              className="size-12 rounded-xl object-cover"
            />
            <span className="text-sm text-muted">
              Run screenshot, {Math.round(shot.size / 1024)} KB
            </span>
          </div>
        )}
      </Card>
      <p className="mt-3 px-1 text-xs text-faint">
        Once you submit, tonight is locked in. No edits.
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
          <Check className="size-5" aria-hidden />
        )}
        {submitting ? "Submitting" : "Submit check-in"}
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
    { label: "No nut", value: b.no_nut, icon: Shield },
    { label: "Streak bonus", value: b.streak_bonus, icon: Flame },
    { label: "Run", value: b.run, icon: Footprints },
    { label: "No alcohol", value: b.no_drink, icon: Wine },
    { label: "No smoking", value: b.no_smoke, icon: Cigarette },
  ];
  return (
    <ul className={cn("space-y-2.5", className)}>
      {rows.map((r) => (
        <li
          key={r.label}
          className={cn(
            "flex items-center gap-3 text-[15px]",
            r.value === 0 && "text-faint",
          )}
        >
          <r.icon className="size-4" aria-hidden />
          <span className="flex-1">{r.label}</span>
          <span className="tabular font-mono font-semibold">+{r.value}</span>
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
    <div className="space-y-3">
      <Card className="animate-pop relative overflow-hidden text-center">
        <div
          className={cn(
            "pointer-events-none absolute -top-24 left-1/2 size-60 -translate-x-1/2 rounded-full blur-3xl",
            clean ? "bg-lime/15" : "bg-pink/15",
          )}
        />
        <div className="relative">
          <span className="mx-auto inline-flex">
            <IconBadge
              icon={clean ? CircleCheck : RefreshCw}
              tone={clean ? "lime" : "pink"}
              size="lg"
            />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {clean ? "Locked in. Well held." : "Logged. Tomorrow is a reset."}
          </h1>
          <p className="tabular mt-3 font-mono text-[56px] leading-none font-semibold text-lime">
            +{result.points}
          </p>
          <p className="mt-1 text-sm text-muted">points tonight</p>
        </div>
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
          tone="lime"
          label={summary ? `of ${summary.total_users} players` : "Rank"}
          value={summary ? `#${summary.rank}` : "-"}
        />
      </div>

      <Card>
        <Breakdown b={result.breakdown} />
      </Card>

      <Card className="flex items-center gap-4">
        <IconBadge icon={Clock} tone="muted" />
        <div className="flex-1">
          {status.next_opens_at ? (
            <>
              <p className="text-sm text-muted">Next check-in opens in</p>
              <p className="text-lg font-semibold">
                <CountdownDigits ms={remaining} size="sm" />
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">
              That was the last night of the season.
            </p>
          )}
        </div>
        <Link
          href="/leaderboard"
          className="rounded-full border border-line px-4 py-2 text-sm font-medium active:bg-surface-2"
        >
          Board
        </Link>
      </Card>
    </div>
  );
}

function SeasonEnded({ summary }: { summary: MySummary | null }) {
  return (
    <div className="space-y-3">
      <Card className="text-center">
        <span className="mx-auto inline-flex">
          <IconBadge icon={Trophy} tone="lime" size="lg" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          The season is over
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Check-ins are closed. Here is how you finished.
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
            tone="lime"
            label="Clean days"
            value={summary.no_nut_days}
          />
          <Stat
            icon={Footprints}
            tone="cyan"
            label="Runs"
            value={summary.runs}
          />
        </div>
      )}
      <Link href="/leaderboard" className={buttonPrimary}>
        See the final board
      </Link>
    </div>
  );
}
