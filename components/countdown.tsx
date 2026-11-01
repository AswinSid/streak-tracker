"use client";

import { useEffect, useRef, useState } from "react";
import { pad, splitDuration } from "@/lib/time";
import { cn } from "@/components/ui";

// Counts down to `target` using the server's clock (serverNow), not the device clock.
export function useServerCountdown(target: string | null, serverNow: string, onDone?: () => void) {
  // First render uses the server timestamp so server and client HTML match.
  const [now, setNow] = useState(() => new Date(serverNow).getTime());
  const fired = useRef(false);

  useEffect(() => {
    const offset = new Date(serverNow).getTime() - Date.now();
    const id = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(id);
  }, [serverNow]);

  const remaining = target ? new Date(target).getTime() - now : 0;

  useEffect(() => {
    if (target && remaining <= 0 && !fired.current) {
      fired.current = true;
      onDone?.();
    }
  }, [remaining, target, onDone]);

  return remaining;
}

export function CountdownDigits({ ms, size = "lg" }: { ms: number; size?: "lg" | "sm" }) {
  const { hours, minutes, seconds } = splitDuration(ms);
  const parts = [
    { v: pad(hours), l: "hrs" },
    { v: pad(minutes), l: "min" },
    { v: pad(seconds), l: "sec" },
  ];
  if (size === "sm") {
    return (
      <span className="tabular font-mono">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    );
  }
  const colors = ["bg-amber", "bg-pink", "bg-cyan"];
  const tilts = ["-rotate-3", "rotate-2", "-rotate-1"];
  return (
    <div className="flex items-start justify-center gap-3" role="timer" aria-live="off">
      {parts.map((p, i) => (
        <div key={p.l} className="text-center">
          <div
            className={cn(
              "tabular min-w-18 rounded-2xl border-2 border-black px-2 py-3 font-mono text-[40px] leading-none font-bold text-black hard-ink",
              colors[i],
              tilts[i],
            )}
          >
            {p.v}
          </div>
          <div className="mt-3 text-[11px] font-extrabold tracking-widest text-faint uppercase">{p.l}</div>
        </div>
      ))}
    </div>
  );
}
