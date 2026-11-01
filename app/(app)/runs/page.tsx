import { Suspense } from "react";
import { Footprints } from "lucide-react";
import { getRunFeedFirstPage } from "@/lib/public-data";
import { RunGallery } from "@/components/run-gallery";
import { Card, IconBadge, PageHeader, Skeleton } from "@/components/ui";

export const metadata = { title: "Runs" };

export default function RunsPage() {
  return (
    <>
      <PageHeader eyebrow="Proof of effort" title="Runs" />
      <div className="px-5">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <Feed />
        </Suspense>
      </div>
    </>
  );
}

async function Feed() {
  const runs = await getRunFeedFirstPage();
  if (runs.length === 0) {
    return (
      <Card className="py-10 text-center">
        <span className="mx-auto inline-flex"><IconBadge icon={Footprints} tone="cyan" size="lg" /></span>
        <p className="mt-4 font-semibold">No runs posted yet</p>
        <p className="mt-1 text-sm text-muted">Go for a run and post the first screenshot tonight.</p>
      </Card>
    );
  }
  return <RunGallery initial={runs} paginate />;
}
