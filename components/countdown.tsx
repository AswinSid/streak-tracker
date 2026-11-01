"use client";

import { useEffect, useRef, useState } from "react";
import { pad, splitDuration } from "@/lib/time";

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
  return (
    <div className="flex items-start justify-center gap-2" role="timer" aria-live="off">
      {parts.map((p, i) => (
        <div key={p.l} className="flex items-start gap-2">
          <div className="text-center">
            <div className="tabular rounded-2xl border border-line bg-surface-2 px-3 py-2 font-mono text-[40px] leading-none font-semibold">
              {p.v}
            </div>
            <div className="mt-1.5 text-[11px] tracking-widest text-faint uppercase">{p.l}</div>
          </div>
          {i < 2 && <span className="pt-3 font-mono text-3xl text-faint">:</span>}
        </div>
      ))}
    </div>
  );
}
