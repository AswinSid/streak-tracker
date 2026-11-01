import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CalendarDays, Flame, Footprints, Shield, Trophy } from "lucide-react";
import { getPublicProfile } from "@/lib/public-data";
import { RunGallery } from "@/components/run-gallery";
import { Card, PageHeader, Skeleton, Stat } from "@/components/ui";

export default function PublicProfilePage({ params }: PageProps<"/u/[username]">) {
  return (
    <Suspense
      fallback={
        <div className="space-y-3 px-5 pt-8">
          <Skeleton className="h-16" />
          <Skeleton className="h-40" />
        </div>
      }
    >
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: { params: PageProps<"/u/[username]">["params"] }) {
  const { username } = await params;
  const p = await getPublicProfile(decodeURIComponent(username));
  if (!p) notFound();

  return (
    <>
      <PageHeader eyebrow={`Rank #${p.rank}`} title={`@${p.username}`} />
      <div className="space-y-3 px-5">
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={Trophy} tone="lime" label="Points" value={p.points} />
          <Stat icon={Flame} tone="amber" label="Current streak" value={p.current_streak} />
          <Stat icon={Shield} tone="lime" label="Clean days" value={p.no_nut_days} />
          <Stat icon={Footprints} tone="cyan" label="Runs" value={p.runs} />
        </div>
        <p className="flex items-center gap-2 px-1 text-xs text-faint">
          <CalendarDays className="size-3.5" aria-hidden /> Checked in {p.days_logged}{" "}
          {p.days_logged === 1 ? "night" : "nights"}
        </p>
        <h2 className="px-1 pt-3 text-sm font-semibold text-muted">Runs</h2>
        {p.run_list.length ? (
          <RunGallery initial={p.run_list} />
        ) : (
          <Card className="text-center text-sm text-muted">No runs posted yet.</Card>
        )}
      </div>
    </>
  );
}
