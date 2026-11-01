import Link from "next/link";
import { Clock, Footprints, ShieldCheck, Trophy } from "lucide-react";
import { GoogleButton } from "@/components/google-button";
import { RulesList } from "@/components/rules-list";
import { Card, IconBadge } from "@/components/ui";
import { APP_NAME } from "@/lib/config";
import { getRules } from "@/lib/public-data";

export default async function Landing() {
  const rules = await getRules();

  return (
    <main className="pt-safe mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10">
      <div className="flex items-center gap-2 pt-6">
        <span className="size-2.5 rounded-full bg-lime shadow-[0_0_12px] shadow-lime" />
        <span className="text-sm font-semibold tracking-wide">{APP_NAME}</span>
      </div>

      <section className="animate-rise pt-12">
        <p className="text-xs font-medium tracking-[0.2em] text-lime uppercase">November 1 to 30</p>
        <h1 className="mt-3 text-[44px] leading-[1.02] font-semibold tracking-tight">
          Hold the line.
          <br />
          <span className="bg-linear-to-r from-lime via-cyan to-violet bg-clip-text text-transparent">
            Win the month.
          </span>
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          One honest check-in every night. Stay clean, go for runs, skip the drinks and smokes, and
          climb a public leaderboard.
        </p>
      </section>

      <div className="mt-8 grid grid-cols-3 gap-2.5">
        {[
          { icon: Clock, tone: "amber" as const, label: "Opens 9 PM" },
          { icon: Footprints, tone: "cyan" as const, label: "Log runs" },
          { icon: Trophy, tone: "lime" as const, label: "Top 100" },
        ].map((f) => (
          <div key={f.label} className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface py-4">
            <IconBadge icon={f.icon} tone={f.tone} size="sm" />
            <span className="text-xs font-medium text-muted">{f.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        <GoogleButton />
        <Link
          href="/leaderboard"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-medium text-muted active:text-ink"
        >
          View the leaderboard
        </Link>
      </div>

      <Card className="mt-6">
        <div className="flex items-start gap-3">
          <IconBadge icon={ShieldCheck} tone="lime" size="sm" />
          <div>
            <h2 className="text-[15px] font-semibold">Your privacy</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              We only store your email (from Google), your username and your daily answers. Nothing
              is sold or shared. Your nightly answers stay private; only your total points, streak and
              run screenshots are public. Delete your account and all your data anytime from
              Profile.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mt-3">
        <h2 className="mb-4 text-[15px] font-semibold">How points work</h2>
        <RulesList rules={rules} />
      </Card>
    </main>
  );
}
