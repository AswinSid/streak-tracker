import { Suspense } from "react";
import { getStatusAndSummary, requireProfile } from "@/lib/dal";
import { CheckinFlow } from "./checkin-flow";
import { Skeleton } from "@/components/ui";

export const metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3 px-5 pt-8">
          <Skeleton className="h-16" />
          <Skeleton className="h-96" />
        </div>
      }
    >
      <TodayContent />
    </Suspense>
  );
}

async function TodayContent() {
  const { userId, username } = await requireProfile();
  const { status, summary } = await getStatusAndSummary();
  return <CheckinFlow userId={userId} username={username} status={status} summary={summary} />;
}
