import { Suspense } from "react";
import { getRunFeedFirstPage } from "@/lib/public-data";
import { RunGallery } from "@/components/run-gallery";
import { Footprints } from "lucide-react";
import { Card, IconBadge, PageHeader, Skeleton } from "@/components/ui";

export const metadata = { title: "Runs" };

export default function RunsPage() {
  return (
    <>
      <PageHeader eyebrow="proof of effort" title="the runs" tone="cyan" />
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
      <Card pop="cyan" className="py-12 text-center">
        <span className="animate-float inline-flex">
          <IconBadge icon={Footprints} tone="cyan" size="lg" />
        </span>
        <p className="mt-4 text-2xl font-extrabold tracking-tight">no runs yet. suspicious.</p>
        <p className="mt-1 text-sm font-medium text-muted">go touch grass and post the first one tonight.</p>
      </Card>
    );
  }
  return <RunGallery initial={runs} paginate />;
}
