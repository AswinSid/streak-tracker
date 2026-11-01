import Link from "next/link";
import { SearchX } from "lucide-react";
import { IconBadge, buttonPrimary } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <IconBadge icon={SearchX} tone="muted" size="lg" />
      <h1 className="mt-5 text-2xl font-semibold">Nothing here</h1>
      <p className="mt-2 text-[15px] text-muted">That page or player does not exist.</p>
      <Link href="/leaderboard" className={`${buttonPrimary} mt-8`}>
        Go to the leaderboard
      </Link>
    </main>
  );
}
