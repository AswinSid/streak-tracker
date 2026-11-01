"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { IconBadge, buttonPrimary } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <IconBadge icon={TriangleAlert} tone="pink" size="lg" />
      <h1 className="mt-5 text-2xl font-semibold">Something broke</h1>
      <p className="mt-2 text-[15px] text-muted">Check your connection and try again.</p>
      <button type="button" onClick={reset} className={`${buttonPrimary} mt-8`}>
        <RefreshCw className="size-4" aria-hidden /> Try again
      </button>
    </main>
  );
}
