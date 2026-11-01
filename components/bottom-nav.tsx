"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Footprints, Trophy, User } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { Logo, cn } from "@/components/ui";

const TABS = [
  { href: "/today", label: "Today", icon: Flame, active: "bg-lime" },
  { href: "/leaderboard", label: "Board", icon: Trophy, active: "bg-amber" },
  { href: "/runs", label: "Runs", icon: Footprints, active: "bg-cyan" },
  { href: "/me", label: "Me", icon: User, active: "bg-pink" },
] as const;

export function BottomNav() {
  return <NavBar pathname={usePathname()} />;
}

// Floating dock on phones, left sidebar from md up.
// Rendered with pathname=null as the Suspense fallback (no active tab).
export function NavBar({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 px-4 md:inset-y-0 md:right-auto md:bottom-0 md:w-60 md:border-r-2 md:border-line md:bg-bg/70 md:px-4 md:pt-8 md:backdrop-blur-xl"
    >
      <Link href="/" className="mb-10 hidden items-center gap-2 px-2 md:flex">
        <Logo />
        <span className="text-xl font-extrabold tracking-tight">{APP_NAME}</span>
      </Link>
      <ul className="mx-auto grid max-w-sm grid-cols-4 gap-1 rounded-[26px] border-2 border-ink bg-surface/90 p-1.5 backdrop-blur-xl hard-ink md:max-w-none md:grid-cols-1 md:gap-2 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
        {TABS.map(({ href, label, icon: Icon, active: activeBg }) => {
          const active = pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 rounded-[20px] text-[11px] font-extrabold uppercase transition md:h-12 md:flex-row md:justify-start md:gap-3 md:rounded-2xl md:border-2 md:px-3 md:text-[15px] md:normal-case",
                  active
                    ? cn(activeBg, "text-black md:border-black md:hard-sm-ink")
                    : "text-faint active:text-ink md:border-transparent md:hover:border-line md:hover:text-ink",
                )}
              >
                <Icon className="size-5.5" strokeWidth={active ? 2.8 : 2.2} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
