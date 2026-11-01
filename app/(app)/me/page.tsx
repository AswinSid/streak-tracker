import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Flame, Footprints, LogOut, Shield, ShieldCheck, Trophy } from "lucide-react";
import { signOut } from "@/app/actions";
import { getStatusAndSummary, requireProfile } from "@/lib/dal";
import { RulesList } from "@/components/rules-list";
import { Card, IconBadge, PageHeader, Skeleton, Stat } from "@/components/ui";
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
        eyebrow={summary ? `Rank #${summary.rank} of ${summary.total_users}` : "Profile"}
        title={`@${username}`}
        right={
          <Link
            href={`/u/${username}`}
            className="mb-1 inline-flex h-10 items-center gap-1 rounded-full border border-line px-3.5 text-sm font-medium active:bg-surface-2"
          >
            Public view <ChevronRight className="size-4" aria-hidden />
          </Link>
        }
      />
      <div className="space-y-3 px-5 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={Trophy} tone="lime" label="Total points" value={summary?.points ?? 0} />
          <Stat icon={Flame} tone="amber" label="Current streak" value={summary?.current_streak ?? 0} />
          <Stat icon={Shield} tone="lime" label="Clean days" value={summary?.no_nut_days ?? 0} />
          <Stat icon={Footprints} tone="cyan" label="Runs" value={summary?.runs ?? 0} />
        </div>

        <Card>
          <h2 className="mb-4 text-[15px] font-semibold">Your November</h2>
          <MonthCalendar
            start={status.season_start}
            end={status.season_end}
            today={status.today}
            history={summary?.history ?? []}
          />
        </Card>

        <Card>
          <h2 className="mb-1 text-[15px] font-semibold">How it works</h2>
          <p className="mb-4 text-sm text-muted">
            Check-in opens every night at 9:00 PM IST and closes at 11:59 PM IST, so you cannot fill
            in the day early. One entry per night, no edits.
          </p>
          <RulesList rules={status.rules} />
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <IconBadge icon={ShieldCheck} tone="lime" size="sm" />
            <p className="text-sm leading-relaxed text-muted">
              We only store your email (from Google), your username and your daily answers. Nothing is
              sold or shared. Your nightly answers are private; your points, streak and run
              screenshots are public.
            </p>
          </div>
        </Card>

        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-[15px] font-medium active:bg-surface-2"
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </form>
        <DeleteAccount />
      </div>
    </>
  );
}
