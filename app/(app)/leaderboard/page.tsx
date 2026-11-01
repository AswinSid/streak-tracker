import { Suspense } from "react";
import Link from "next/link";
import { Crown, Flame, Footprints, Medal, Trophy, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard } from "@/lib/public-data";
import type { LeaderboardRow, MySummary } from "@/lib/types";
import { Card, IconBadge, PageHeader, Skeleton, cn } from "@/components/ui";

export const metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  return (
    <>
      <PageHeader eyebrow="Top 100" title="Leaderboard" />
      <div className="space-y-3 px-5">
        <Suspense fallback={<Skeleton className="h-[72px]" />}>
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
      <Link href="/" className="flex items-center gap-3 rounded-3xl border border-lime/30 bg-lime/10 p-4 active:bg-lime/15">
        <IconBadge icon={UserRound} tone="lime" size="sm" />
        <span className="flex-1 text-[15px] font-medium">Join the challenge to get ranked</span>
        <span className="text-sm font-semibold text-lime">Sign in</span>
      </Link>
    );
  }
  const { data } = await supabase.rpc("get_my_summary");
  const me = data as unknown as MySummary | null;
  if (!me) return null;
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-lime/30 bg-lime/10 p-4">
      <span className="tabular w-10 font-mono text-lg font-semibold text-lime">#{me.rank}</span>
      <span className="flex-1 truncate text-[15px] font-semibold">You, @{me.username}</span>
      <span className="flex items-center gap-1 text-sm text-amber">
        <Flame className="size-4" aria-hidden />
        <span className="tabular font-mono">{me.current_streak}</span>
      </span>
      <span className="tabular w-14 text-right font-mono text-[15px] font-semibold">{me.points}</span>
    </div>
  );
}

async function Board() {
  const rows = await getLeaderboard();
  if (rows.length === 0) {
    return (
      <Card className="py-10 text-center">
        <span className="mx-auto inline-flex"><IconBadge icon={Trophy} tone="muted" size="lg" /></span>
        <p className="mt-4 font-semibold">No players yet</p>
        <p className="mt-1 text-sm text-muted">Be the first name on the board.</p>
      </Card>
    );
  }
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <>
      <div className="grid grid-cols-3 items-end gap-2.5">
        {[podium[1], podium[0], podium[2]].map((r, i) =>
          r ? <PodiumCard key={r.username} row={r} tall={i === 1} /> : <div key={`empty-${i}`} />,
        )}
      </div>
      {rest.length > 0 && (
        <Card className="p-0">
          <ol className="divide-y divide-line">
            {rest.map((r) => (
              <li key={r.username}>
                <Link href={`/u/${r.username}`} className="flex h-16 items-center gap-3 px-4 active:bg-surface-2">
                  <span className="tabular w-8 font-mono text-sm text-faint">{r.rank}</span>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">@{r.username}</span>
                  {r.runs > 0 && (
                    <span className="flex items-center gap-1 text-xs text-cyan">
                      <Footprints className="size-3.5" aria-hidden />
                      <span className="tabular font-mono">{r.runs}</span>
                    </span>
                  )}
                  <span className="flex w-12 items-center justify-end gap-1 text-xs text-amber">
                    <Flame className="size-3.5" aria-hidden />
                    <span className="tabular font-mono">{r.current_streak}</span>
                  </span>
                  <span className="tabular w-14 text-right font-mono text-[15px] font-semibold">{r.points}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      )}
      <p className="px-1 pb-2 text-center text-xs text-faint">Updates about every minute. Ties go to the longer streak.</p>
    </>
  );
}

function PodiumCard({ row, tall }: { row: LeaderboardRow; tall: boolean }) {
  const style =
    row.rank === 1
      ? { ring: "border-lime/50 bg-lime/10", text: "text-lime", icon: Crown }
      : row.rank === 2
        ? { ring: "border-cyan/40 bg-cyan/10", text: "text-cyan", icon: Medal }
        : { ring: "border-violet/40 bg-violet/10", text: "text-violet", icon: Medal };
  const Icon = style.icon;
  return (
    <Link
      href={`/u/${row.username}`}
      className={cn(
        "flex flex-col items-center rounded-3xl border px-2 text-center active:scale-[0.98]",
        style.ring,
        tall ? "pt-6 pb-5" : "pt-4 pb-4",
      )}
    >
      <Icon className={cn(tall ? "size-7" : "size-5", style.text)} aria-hidden />
      <span className={cn("tabular mt-2 font-mono text-xs font-semibold", style.text)}>#{row.rank}</span>
      <span className="mt-1 w-full truncate text-sm font-semibold">@{row.username}</span>
      <span className={cn("tabular mt-2 font-mono font-semibold", tall ? "text-2xl" : "text-lg")}>{row.points}</span>
      <span className="mt-1 flex items-center gap-1 text-[11px] text-amber">
        <Flame className="size-3" aria-hidden /> {row.current_streak}
      </span>
    </Link>
  );
}
