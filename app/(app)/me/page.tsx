import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight, Flame, Footprints, LogOut, Shield, ShieldCheck, Trophy } from "lucide-react";
import { signOut } from "@/app/actions";
import { getStatusAndSummary, requireProfile } from "@/lib/dal";
import { RulesList } from "@/components/rules-list";
import { Card, IconBadge, PageHeader, Skeleton, Stat, Sticker, buttonSecondary } from "@/components/ui";
import { MonthCalendar } from "./month-calendar";
import { DeleteAccount } from "./delete-account";

export const metadata = { title: "Profile" };

export default function MePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3 px-5 pt-8">
          <Skeleton className="h-16" />
          <Skeleton className="h-40" />
          <Skeleton className="h-72" />
        </div>
      }
    >
      <Me />
    </Suspense>
  );
}

async function Me() {
  const { username } = await requireProfile();
  const { status, summary } = await getStatusAndSummary();

  return (
    <>
      <PageHeader
        tone="pink"
        eyebrow={summary ? `rank #${summary.rank} of ${summary.total_users}` : "profile"}
        title={`@${username}`}
        right={
          <Link
            href={`/u/${username}`}
            className="press mb-1 inline-flex h-10 shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-surface-2 px-3.5 text-sm font-extrabold hard-sm-ink"
          >
            public <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        }
      />
      <div className="space-y-4 px-5 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={Trophy} tone="lime" label="Total points" value={summary?.points ?? 0} />
          <Stat icon={Flame} tone="amber" label="Current streak" value={summary?.current_streak ?? 0} />
          <Stat icon={Shield} tone="violet" label="Clean days" value={summary?.no_nut_days ?? 0} />
          <Stat icon={Footprints} tone="cyan" label="Runs" value={summary?.runs ?? 0} />
        </div>

        <Card pop="pink">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-extrabold tracking-tight">your november arc</h2>
            <Sticker tone="pink" rotate={4}>
              {summary?.days_logged ?? 0}/30
            </Sticker>
          </div>
          <MonthCalendar
            start={status.season_start}
            end={status.season_end}
            today={status.today}
            history={summary?.history ?? []}
          />
        </Card>

        <Card>
          <h2 className="text-xl font-extrabold tracking-tight">the rules, again</h2>
          <p className="mt-1 mb-4 text-sm font-medium text-muted">
            Check-in opens every night at 9:00 PM IST and closes at 11:59 PM IST. No filling it in
            early. One entry a night, no edits.
          </p>
          <RulesList rules={status.rules} />
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <IconBadge icon={ShieldCheck} tone="cyan" size="sm" />
            <p className="text-sm leading-relaxed font-medium text-muted">
              We only store your Google email, your username and your nightly answers. Nothing sold
              or shared. Your answers stay private; your points, streak and run pics are public.
            </p>
          </div>
        </Card>

        <form action={signOut}>
          <button type="submit" className={buttonSecondary}>
            <LogOut className="size-4" aria-hidden /> log out
          </button>
        </form>
        <DeleteAccount />
      </div>
    </>
  );
}
