import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/dal";
import { getRules } from "@/lib/public-data";
import { OnboardingFlow } from "./onboarding-flow";
import { Skeleton } from "@/components/ui";

export const metadata = { title: "Welcome" };

export default function OnboardingPage() {
  return (
    <main className="pt-safe mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 pb-8 md:max-w-lg">
      <Suspense fallback={<Skeleton className="mt-16 h-80" />}>
        <Gate />
      </Suspense>
    </main>
  );
}

async function Gate() {
  const [{ userId, profile }, rules] = await Promise.all([getOwnProfile(), getRules()]);
  if (!userId) redirect("/");
  if (profile?.onboarded) redirect("/today");
  return <OnboardingFlow initialUsername={profile?.username ?? null} rules={rules} />;
}
