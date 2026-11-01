"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AtSign,
  Camera,
  Check,
  CircleX,
  Clock,
  LoaderCircle,
  Lock,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import type { Rules } from "@/lib/types";
import { RulesList } from "@/components/rules-list";
import { Card, IconBadge, buttonPrimary, buttonSecondary, cn, type Tone } from "@/components/ui";

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

type Availability = "idle" | "invalid" | "checking" | "available" | "taken";

export function OnboardingFlow({
  initialUsername,
  rules,
}: {
  initialUsername: string | null;
  rules: Rules;
}) {
  const [step, setStep] = useState<"username" | "how">(initialUsername ? "how" : "username");
  const [username, setUsername] = useState(initialUsername ?? "");

  return step === "username" ? (
    <UsernameStep
      value={username}
      onChange={setUsername}
      onDone={(name) => {
        setUsername(name);
        setStep("how");
      }}
    />
  ) : (
    <HowItWorks username={username} rules={rules} />
  );
}

function UsernameStep({
  value,
  onChange,
  onDone,
}: {
  value: string;
  onChange: (v: string) => void;
  onDone: (name: string) => void;
}) {
  const [checked, setChecked] = useState<{ name: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = value.trim();
  const valid = USERNAME_RE.test(trimmed);

  const availability: Availability = !trimmed
    ? "idle"
    : !valid
      ? "invalid"
      : checked?.name !== trimmed
        ? "checking"
        : checked.ok
          ? "available"
          : "taken";

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await createClient().rpc("is_username_available", { p_username: trimmed });
      if (!cancelled) setChecked({ name: trimmed, ok: Boolean(data) });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trimmed, valid]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (availability !== "available") return;
    setSaving(true);
    setError(null);
    const { error } = await createClient().rpc("claim_username", { p_username: trimmed });
    setSaving(false);
    if (error) {
      setError(friendlyError(error));
      setChecked({ name: trimmed, ok: false });
      return;
    }
    onDone(trimmed);
  }

  const hint: Record<Availability, { text: string; className: string; icon?: LucideIcon }> = {
    idle: { text: "3 to 20 characters. Letters, numbers and underscores.", className: "text-faint" },
    invalid: { text: "Only letters, numbers and underscores. 3 to 20 characters.", className: "text-amber" },
    checking: { text: "Checking availability", className: "text-muted", icon: LoaderCircle },
    available: { text: `${trimmed} is yours if you want it`, className: "text-lime", icon: Check },
    taken: { text: "Already taken. Try another one.", className: "text-pink", icon: CircleX },
  };
  const h = hint[availability];

  return (
    <form onSubmit={submit} className="animate-rise flex flex-1 flex-col pt-14">
      <IconBadge icon={AtSign} tone="lime" size="lg" />
      <h1 className="mt-6 text-[32px] leading-tight font-semibold tracking-tight">Pick your username</h1>
      <p className="mt-2 text-[15px] text-muted">
        This is how you show up on the public leaderboard. Keep it anonymous if you like.
      </p>

      <label htmlFor="username" className="sr-only">
        Username
      </label>
      <div
        className={cn(
          "mt-8 flex h-16 items-center gap-2 rounded-2xl border bg-surface px-4 transition focus-within:border-lime",
          availability === "taken" ? "border-pink" : "border-line",
        )}
      >
        <span className="text-lg text-faint">@</span>
        <input
          id="username"
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={20}
          inputMode="text"
          enterKeyHint="go"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\s/g, ""))}
          placeholder="night_runner"
          className="h-full min-w-0 flex-1 bg-transparent text-lg font-medium outline-none placeholder:text-faint"
        />
        <span className="tabular font-mono text-xs text-faint">{trimmed.length}/20</span>
      </div>
      <p className={cn("mt-2.5 flex items-center gap-1.5 text-sm", h.className)} aria-live="polite">
        {h.icon && (
          <h.icon className={cn("size-4", availability === "checking" && "animate-spin")} aria-hidden />
        )}
        {h.text}
      </p>
      {error && <p className="mt-2 text-sm text-pink">{error}</p>}

      <div className="mt-auto pt-8">
        <button type="submit" disabled={availability !== "available" || saving} className={buttonPrimary}>
          {saving ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : null}
          Continue
          {!saving && <ArrowRight className="size-5" aria-hidden />}
        </button>
      </div>
    </form>
  );
}

function HowItWorks({ username, rules }: { username: string; rules: Rules }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slides: { icon: LucideIcon; tone: Tone; title: string; body: React.ReactNode }[] = [
    {
      icon: Clock,
      tone: "amber",
      title: "Opens at 9 PM. Not a minute earlier.",
      body: (
        <ul className="space-y-3 text-[15px] leading-relaxed text-muted">
          <Bullet icon={Lock}>
            The check-in unlocks at <b className="text-ink">9:00 PM IST</b> and closes at{" "}
            <b className="text-ink">11:59 PM IST</b>. You cannot fill in today early, so your answers
            cover the whole day.
          </Bullet>
          <Bullet icon={Check}>One entry per night. Once submitted it is locked in.</Bullet>
          <Bullet icon={CircleX}>Miss the window and the day scores zero and breaks your streak.</Bullet>
        </ul>
      ),
    },
    {
      icon: Trophy,
      tone: "lime",
      title: "Every night earns points",
      body: <RulesList rules={rules} />,
    },
    {
      icon: Camera,
      tone: "cyan",
      title: "Runs need proof",
      body: (
        <ul className="space-y-3 text-[15px] leading-relaxed text-muted">
          <Bullet icon={Camera}>
            Ran today? Upload a screenshot from Strava, Adidas Running or any app you use.
          </Bullet>
          <Bullet icon={Check}>
            It is compressed on your phone before upload, so it is quick even on mobile data.
          </Bullet>
          <Bullet icon={Lock}>
            Run screenshots are public. Crop out any map that shows where you live.
          </Bullet>
        </ul>
      ),
    },
  ];

  const last = index === slides.length - 1;
  const slide = slides[index];

  async function finish() {
    setFinishing(true);
    setError(null);
    const { error } = await createClient().rpc("complete_onboarding");
    if (error) {
      setError(friendlyError(error));
      setFinishing(false);
      return;
    }
    router.replace("/today");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col pt-10">
      <p className="text-sm text-muted">
        Welcome, <span className="font-semibold text-lime">@{username}</span>
      </p>
      <div className="mt-4 flex gap-1.5" aria-hidden>
        {slides.map((_, i) => (
          <span
            key={i}
            className={cn("h-1 flex-1 rounded-full transition", i <= index ? "bg-lime" : "bg-line")}
          />
        ))}
      </div>

      <div key={index} className="animate-rise mt-8 flex-1">
        <IconBadge icon={slide.icon} tone={slide.tone} size="lg" />
        <h1 className="mt-5 text-[28px] leading-tight font-semibold tracking-tight">{slide.title}</h1>
        <Card className="mt-6">{slide.body}</Card>
      </div>

      {error && <p className="mt-4 text-sm text-pink">{error}</p>}
      <div className="mt-8 flex gap-3">
        {index > 0 && (
          <button type="button" onClick={() => setIndex(index - 1)} className={cn(buttonSecondary, "w-auto px-5")}>
            Back
          </button>
        )}
        <button
          type="button"
          onClick={last ? finish : () => setIndex(index + 1)}
          disabled={finishing}
          className={buttonPrimary}
        >
          {finishing && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
          {last ? "Let's go" : "Next"}
          {!finishing && <ArrowRight className="size-5" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

function Bullet({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-1 size-4 shrink-0 text-faint" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
