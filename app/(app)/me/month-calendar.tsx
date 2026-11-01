import { Footprints, Skull } from "lucide-react";
import { seasonDays } from "@/lib/time";
import type { DayEntry } from "@/lib/types";
import { cn } from "@/components/ui";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function MonthCalendar({
  start,
  end,
  today,
  history,
}: {
  start: string;
  end: string;
  today: string;
  history: DayEntry[];
}) {
  const byDay = new Map(history.map((h) => [h.day, h]));
  const days = seasonDays(start, end);
  // Monday-first offset for the first day.
  const first = new Date(`${start}T00:00:00Z`).getUTCDay();
  const offset = (first + 6) % 7;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-extrabold text-faint">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const e = byDay.get(day);
          const future = day > today;
          const isToday = day === today;
          const n = Number(day.slice(8));
          return (
            <span
              key={day}
              title={e ? `${day}: +${e.points}` : day}
              className={cn(
                "tabular relative flex aspect-square items-center justify-center rounded-xl text-xs font-extrabold",
                e
                  ? e.nutted
                    ? "border-2 border-black bg-pink text-black"
                    : "border-2 border-black bg-lime text-black"
                  : future
                    ? "border-2 border-dashed border-line text-faint"
                    : isToday
                      ? "bg-surface-2 text-ink"
                      : "bg-surface-2 text-faint line-through decoration-faint/60",
                isToday && "ring-2 ring-amber ring-offset-2 ring-offset-surface",
              )}
            >
              {e?.nutted ? <Skull className="size-4" strokeWidth={2.6} aria-label="slipped" /> : n}
              {e?.ran && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-black bg-cyan text-black">
                  <Footprints className="size-2.5" strokeWidth={3} aria-label="ran" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-muted">
        <Legend className="bg-lime" label="clean" />
        <Legend className="bg-pink" label="slipped" />
        <Legend className="bg-surface-2" label="missed" />
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-black bg-cyan" /> ran
        </span>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded border border-black", className)} /> {label}
    </span>
  );
}
