"use client";

import { RefreshCw, Zap } from "lucide-react";
import { IconBadge, buttonPrimary } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <span className="animate-wiggle inline-flex">
        <IconBadge icon={Zap} tone="pink" size="lg" />
      </span>
      <h1 className="mt-6 text-[40px] leading-none font-extrabold tracking-tighter">ok that broke.</h1>
      <p className="mt-3 text-[15px] font-medium text-muted">Check your connection and run it back.</p>
      <button type="button" onClick={reset} className={`${buttonPrimary} mt-8`}>
        <RefreshCw className="size-4" aria-hidden /> try again
      </button>
    </main>
  );
}
