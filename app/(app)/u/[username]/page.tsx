import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CalendarDays, Flame, Footprints, Shield, Sofa, Trophy } from "lucide-react";
import { getPublicProfile } from "@/lib/public-data";
import { RunGallery } from "@/components/run-gallery";
import { Card, IconBadge, PageHeader, Skeleton, Stat, Sticker } from "@/components/ui";

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
      <PageHeader tone="violet" eyebrow={`rank #${p.rank}`} title={`@${p.username}`} />
      <div className="space-y-4 px-5">
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={Trophy} tone="lime" label="Points" value={p.points} />
          <Stat icon={Flame} tone="amber" label="Current streak" value={p.current_streak} />
          <Stat icon={Shield} tone="violet" label="Clean days" value={p.no_nut_days} />
          <Stat icon={Footprints} tone="cyan" label="Runs" value={p.runs} />
        </div>
        <p className="flex items-center gap-1.5 px-1 text-sm font-semibold text-faint">
          <CalendarDays className="size-4" aria-hidden /> checked in {p.days_logged} {p.days_logged === 1 ? "night" : "nights"}
        </p>
        <div className="flex items-center gap-2 px-1 pt-3">
          <h2 className="text-2xl font-extrabold tracking-tight">run receipts</h2>
          <Sticker tone="cyan" rotate={-4}>
            {p.run_list.length}
          </Sticker>
        </div>
        {p.run_list.length ? (
          <RunGallery initial={p.run_list} />
        ) : (
          <Card className="py-8 text-center">
            <span className="inline-flex">
              <IconBadge icon={Sofa} tone="muted" />
            </span>
            <p className="mt-2 text-sm font-bold text-muted">no runs posted yet.</p>
          </Card>
        )}
      </div>
    </>
  );
}
