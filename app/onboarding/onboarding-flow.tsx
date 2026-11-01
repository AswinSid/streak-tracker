"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AtSign,
  Camera,
  Check,
  CircleX,
  LoaderCircle,
  Lock,
  Moon,
  Rocket,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import type { Rules } from "@/lib/types";
import { RulesList } from "@/components/rules-list";
import { Card, IconBadge, Sticker, buttonPrimary, buttonSecondary, cn, type Tone } from "@/components/ui";

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
    checking: { text: "checking the vibes…", className: "text-muted", icon: LoaderCircle },
    available: { text: `@${trimmed} is free. it's giving main character.`, className: "text-lime", icon: Check },
    taken: { text: "someone already took it. try another", className: "text-pink", icon: CircleX },
  };
  const h = hint[availability];

  return (
    <form onSubmit={submit} className="animate-rise flex flex-1 flex-col pt-14">
      <div className="flex items-center gap-3">
        <IconBadge icon={AtSign} tone="lime" size="lg" />
        <Sticker tone="pink" rotate={5}>
          step 1 of 2
        </Sticker>
      </div>
      <h1 className="mt-7 text-[48px] leading-[0.9] font-extrabold tracking-tighter">
        what do we
        <br />
        call you?
      </h1>
      <p className="mt-4 text-[15px] font-medium text-muted">
        This is your name on the public board. Go anon if you want, we won&apos;t judge.
      </p>

      <label htmlFor="username" className="sr-only">
        Username
      </label>
      <div
        className={cn(
          "mt-8 flex h-16 items-center gap-2 rounded-2xl border-2 bg-surface px-4 transition focus-within:border-lime",
          availability === "taken" ? "border-pink hard-pink" : availability === "available" ? "border-lime hard-lime" : "border-ink hard-ink",
        )}
      >
        <span className="text-xl font-extrabold text-lime">@</span>
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
          className="h-full min-w-0 flex-1 bg-transparent text-xl font-extrabold outline-none placeholder:font-semibold placeholder:text-faint"
        />
        <span className="tabular font-mono text-xs font-bold text-faint">{trimmed.length}/20</span>
      </div>
      <p className={cn("mt-3.5 flex items-center gap-1.5 text-sm font-bold", h.className)} aria-live="polite">
        {h.icon && (
          <h.icon className={cn("size-4", availability === "checking" && "animate-spin")} aria-hidden />
        )}
        {h.text}
      </p>
      {error && <p className="mt-2 text-sm text-pink">{error}</p>}

      <div className="mt-auto pt-8">
        <button type="submit" disabled={availability !== "available" || saving} className={buttonPrimary}>
          {saving ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : null}
          claim it
          {!saving && <ArrowRight className="size-5" strokeWidth={2.6} aria-hidden />}
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
      icon: Moon,
      tone: "amber",
      title: "it drops at 9pm. not a minute earlier.",
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
      icon: Zap,
      tone: "lime",
      title: "every night = points. stack 'em.",
      body: <RulesList rules={rules} />,
    },
    {
      icon: Camera,
      tone: "cyan",
      title: "runs need receipts.",
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
      <p className="text-lg font-extrabold">
        welcome in, <span className="text-lime">@{username}</span>
      </p>
      <div className="mt-4 flex h-4 gap-1 rounded-full border-2 border-ink p-0.5" aria-hidden>
        {slides.map((_, i) => (
          <span
            key={i}
            className={cn("flex-1 rounded-full transition-colors duration-300", i <= index ? "bg-lime" : "bg-transparent")}
          />
        ))}
      </div>

      <div key={index} className="animate-rise mt-8 flex-1">
        <div className="flex items-center gap-3">
          <IconBadge icon={slide.icon} tone={slide.tone} size="lg" />
          <Sticker tone={slide.tone} rotate={4}>
            {index + 1} / {slides.length}
          </Sticker>
        </div>
        <h1 className="mt-6 text-[38px] leading-[0.92] font-extrabold tracking-tighter">{slide.title}</h1>
        <Card pop={slide.tone} className="mt-6">
          {slide.body}
        </Card>
      </div>

      {error && <p className="mt-4 text-sm font-bold text-pink">{error}</p>}
      <div className="mt-8 flex gap-3">
        {index > 0 && (
          <button type="button" onClick={() => setIndex(index - 1)} className={cn(buttonSecondary, "w-auto px-5")}>
            back
          </button>
        )}
        <button
          type="button"
          onClick={last ? finish : () => setIndex(index + 1)}
          disabled={finishing}
          className={buttonPrimary}
        >
          {finishing && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
          {last ? "let's gooo" : "next"}
          {!finishing &&
            (last ? (
              <Rocket className="size-5" strokeWidth={2.6} aria-hidden />
            ) : (
              <ArrowRight className="size-5" strokeWidth={2.6} aria-hidden />
            ))}
        </button>
      </div>
    </div>
  );
}

function Bullet({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-surface-2 p-3 font-medium">
      <Icon className="mt-0.5 size-4.5 shrink-0 text-ink" strokeWidth={2.6} aria-hidden />
      <span>{children}</span>
    </li>
  );
}
