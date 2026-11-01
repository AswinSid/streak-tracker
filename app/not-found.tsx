import Link from "next/link";
import { Ghost } from "lucide-react";
import { IconBadge, buttonPrimary } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <span className="animate-wiggle inline-flex">
        <IconBadge icon={Ghost} tone="violet" size="lg" />
      </span>
      <p className="mt-5 font-mono text-sm font-bold text-faint">404</p>
      <h1 className="mt-1 text-[40px] leading-none font-extrabold tracking-tighter">who? never heard of them.</h1>
      <p className="mt-3 text-[15px] font-medium text-muted">That page or player doesn&apos;t exist.</p>
      <Link href="/leaderboard" className={`${buttonPrimary} mt-8`}>
        take me to the board
      </Link>
    </main>
  );
}
