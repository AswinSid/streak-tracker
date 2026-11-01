import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Crown, Eye, Flame, Footprints, Medal, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard } from "@/lib/public-data";
import type { LeaderboardRow, MySummary } from "@/lib/types";
import { Card, IconBadge, PageHeader, Skeleton, cn } from "@/components/ui";

export const metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  return (
    <>
      <PageHeader eyebrow="top 100" title="the board" tone="amber" />
      <div className="space-y-4 px-5">
        <Suspense fallback={<Skeleton className="h-18" />}>
          <MyRank />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-96" />}>
          <Board />
        </Suspense>
      </div>
    </>
  );
}

async function MyRank() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return (
      <Link
        href="/"
        className="press flex items-center gap-3 rounded-[22px] border-2 border-black bg-lime p-4 text-black hard-ink"
      >
        <Eye className="size-6 shrink-0" strokeWidth={2.6} aria-hidden />
        <span className="flex-1 text-[15px] font-extrabold">you&apos;re not on here yet. join the league</span>
        <ArrowRight className="size-5" strokeWidth={2.8} aria-hidden />
      </Link>
    );
  }
  const { data } = await supabase.rpc("get_my_summary");
  const me = data as unknown as MySummary | null;
  if (!me) return null;
  return (
    <div className="flex items-center gap-3 rounded-[22px] border-2 border-black bg-lime p-4 text-black hard-ink">
      <span className="tabular font-mono text-xl font-bold">#{me.rank}</span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-extrabold">you (@{me.username})</span>
      <span className="tabular flex items-center gap-0.5 font-mono text-sm font-bold">
        <Flame className="size-4" strokeWidth={2.6} aria-hidden />
        {me.current_streak}
      </span>
      <span className="tabular w-14 text-right text-xl font-extrabold">{me.points}</span>
    </div>
  );
}

async function Board() {
  const rows = await getLeaderboard();
  if (rows.length === 0) {
    return (
      <Card pop="amber" className="py-12 text-center">
        <span className="animate-wiggle inline-flex">
          <IconBadge icon={Trophy} tone="amber" size="lg" />
        </span>
        <p className="mt-4 text-2xl font-extrabold tracking-tight">it&apos;s empty in here</p>
        <p className="mt-1 text-sm font-medium text-muted">be the first name on the board. main character energy.</p>
      </Card>
    );
  }
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <>
      <div className="grid grid-cols-3 items-end gap-3 pt-6">
        {[podium[1], podium[0], podium[2]].map((r, i) =>
          r ? <PodiumCard key={r.username} row={r} /> : <div key={`empty-${i}`} />,
        )}
      </div>
      {rest.length > 0 && (
        <Card className="p-2">
          <ol className="space-y-1">
            {rest.map((r) => (
              <li key={r.username}>
                <Link
                  href={`/u/${r.username}`}
                  className="flex h-14 items-center gap-3 rounded-2xl px-3 transition active:bg-surface-2 md:hover:bg-surface-2"
                >
                  <span className="tabular w-8 font-mono text-sm font-bold text-faint">{r.rank}</span>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-bold">@{r.username}</span>
                  {r.runs > 0 && (
                    <span className="tabular flex items-center gap-1 rounded-full bg-cyan/12 px-2 py-0.5 font-mono text-xs font-bold text-cyan">
                      <Footprints className="size-3.5" aria-hidden />
                      {r.runs}
                    </span>
                  )}
                  <span className="tabular flex items-center gap-1 rounded-full bg-amber/12 px-2 py-0.5 font-mono text-xs font-bold text-amber">
                    <Flame className="size-3.5" aria-hidden />
                    {r.current_streak}
                  </span>
                  <span className="tabular w-12 text-right text-lg font-extrabold">{r.points}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      )}
      <p className="px-1 pb-2 text-center text-xs font-semibold text-faint">
        refreshes about every minute · ties go to the longer streak
      </p>
    </>
  );
}

const PODIUM = {
  1: { bg: "bg-lime", text: "text-lime", icon: Crown, h: "h-36", tilt: "rotate-0", label: "the GOAT" },
  2: { bg: "bg-cyan", text: "text-cyan", icon: Medal, h: "h-28", tilt: "-rotate-2", label: "so close" },
  3: { bg: "bg-pink", text: "text-pink", icon: Medal, h: "h-24", tilt: "rotate-2", label: "on the pod" },
} as const;

function PodiumCard({ row }: { row: LeaderboardRow }) {
  const s = PODIUM[row.rank as 1 | 2 | 3] ?? PODIUM[3];
  return (
    <Link href={`/u/${row.username}`} className={cn("press flex flex-col items-center text-center", s.tilt)}>
      <s.icon
        className={cn(s.text, row.rank === 1 ? "animate-float size-11 fill-lime/25" : "size-8")}
        strokeWidth={2.4}
        aria-hidden
      />
      <span className="mt-1 w-full truncate text-sm font-extrabold">@{row.username}</span>
      <span className="text-[10px] font-bold text-faint uppercase">{s.label}</span>
      <span
        className={cn(
          "mt-2 flex w-full flex-col items-center justify-start rounded-t-[20px] rounded-b-lg border-2 border-black pt-3 text-black hard-ink",
          s.bg,
          s.h,
        )}
      >
        <span className="tabular text-[28px] leading-none font-extrabold tracking-tight">{row.points}</span>
        <span className="mt-1 flex items-center gap-0.5 text-[11px] font-bold opacity-70">
          <Flame className="size-3" strokeWidth={2.8} aria-hidden />
          {row.current_streak} streak
        </span>
        <span className="mt-auto pb-2 font-mono text-2xl font-bold opacity-30">#{row.rank}</span>
      </span>
    </Link>
  );
}
