import Link from "next/link";
import {
  ArrowUpRight,
  BeerOff,
  CigaretteOff,
  Footprints,
  Moon,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { GoogleButton } from "@/components/google-button";
import { RulesList } from "@/components/rules-list";
import { Card, IconBadge, Logo, Marquee, Sticker, cn } from "@/components/ui";
import { APP_NAME } from "@/lib/config";
import { getRules } from "@/lib/public-data";

const TILES = [
  {
    icon: Moon,
    title: "9pm drop",
    body: "check-in unlocks every night. not a sec earlier.",
    bg: "bg-amber",
    tilt: "-rotate-2",
  },
  {
    icon: Footprints,
    title: "run = proof",
    body: "post the screenshot or it didn't happen.",
    bg: "bg-cyan",
    tilt: "rotate-2",
  },
  {
    icon: Trophy,
    title: "top 100",
    body: "points, streaks, public glory.",
    bg: "bg-pink",
    tilt: "-rotate-1",
  },
];

export default async function Landing() {
  const rules = await getRules();

  return (
    <main className="pt-safe min-h-dvh overflow-x-hidden pb-12">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 pt-6 lg:max-w-6xl lg:px-8">
        <span className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-extrabold tracking-tight">
            {APP_NAME}
          </span>
        </span>
        <Sticker tone="pink" rotate={4}>
          nov 1 – 30
        </Sticker>
      </div>

      <div className="mx-auto max-w-md px-5 lg:grid lg:max-w-6xl lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-14 lg:px-8 lg:pt-10">
        <div>
          <section className="animate-rise relative pt-10 lg:pt-4">
            <span
              className="animate-float pointer-events-none absolute top-6 right-0"
              aria-hidden
            >
              <IconBadge icon={CigaretteOff} tone="pink" size="lg" />
            </span>
            <span
              className="animate-float pointer-events-none absolute top-30 right-3 z-10 rotate-12 [animation-delay:1.2s] lg:top-44"
              aria-hidden
            >
              <IconBadge icon={BeerOff} tone="violet" />
            </span>
            <h1 className="text-[64px] leading-[0.86] font-extrabold tracking-tighter lg:text-[104px]">
              no nut.
              <br />
              <span className="text-outline">no cap.</span>
              <br />
              <span className="mt-3 inline-block -rotate-2 rounded-2xl border-2 border-black bg-lime px-3 pb-1 text-[50px] whitespace-nowrap text-black hard-lg-pink lg:text-[88px]">
                no excuses.
              </span>
            </h1>
            <p className="mt-7 max-w-sm text-lg leading-snug font-medium text-muted">
              Vanakkam Tamil Yapping Nanbargale! One honest check-in every night
              at 9. Hold the streak, go touch grass (run), skip the drinks +
              smokes, and{" "}
              <span className="font-extrabold text-ink">
                flex on the leaderboard.
              </span>
            </p>
            <p>Vanakkam Tamil Yappers Nanbargale</p>
          </section>

          <div className="mt-9 space-y-3">
            <GoogleButton />
            <Link
              href="/leaderboard"
              className="flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl text-[15px] font-bold text-muted underline-offset-4 active:text-ink lg:justify-start"
            >
              just lurking? peek the board{" "}
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="mt-10 lg:mt-0">
          <div className="grid grid-cols-3 gap-3">
            {TILES.map((t) => (
              <div
                key={t.title}
                className={cn(
                  "rounded-[22px] border-2 border-black p-3 text-black hard-ink",
                  t.bg,
                  t.tilt,
                )}
              >
                <t.icon className="size-7" strokeWidth={2.6} aria-hidden />
                <p className="mt-2 text-[15px] leading-tight font-extrabold">
                  {t.title}
                </p>
                <p className="mt-1 text-[11px] leading-snug font-semibold opacity-75">
                  {t.body}
                </p>
              </div>
            ))}
          </div>

          <Card pop="lime" className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold tracking-tight">
                the point system
              </h2>
              <Sticker tone="amber" rotate={3}>
                per night
              </Sticker>
            </div>
            <RulesList rules={rules} />
          </Card>

          <Card className="mt-4">
            <div className="flex items-start gap-3">
              <IconBadge icon={ShieldCheck} tone="cyan" size="sm" />
              <div>
                <h2 className="font-extrabold">This is a FUN project!</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Only your Google email, your username and your nightly answers
                  are stored. That's it. This is a fun project! and the entire
                  database will be Deleted at December 5
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Marquee
        className="-mx-4 mt-14 -rotate-2"
        tone="lime"
        items={[
          "30 days",
          "1 check-in a night",
          "streak bonus",
          "proof or it didn't happen",
          "touch grass",
          "top 100",
        ]}
      />
    </main>
  );
}
