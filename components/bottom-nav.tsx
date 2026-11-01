"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Footprints, Trophy, User } from "lucide-react";
import { cn } from "@/components/ui";

const TABS = [
  { href: "/today", label: "Today", icon: Flame },
  { href: "/leaderboard", label: "Board", icon: Trophy },
  { href: "/runs", label: "Runs", icon: Footprints },
  { href: "/me", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  return <NavBar pathname={usePathname()} />;
}

// Rendered with pathname=null as the Suspense fallback (no active tab).
export function NavBar({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 backdrop-blur-xl"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                  active ? "text-lime" : "text-faint active:text-ink",
                )}
              >
                <Icon className="size-5.5" strokeWidth={active ? 2.4 : 2} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
