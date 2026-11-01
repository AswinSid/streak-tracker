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
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-faint">
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
                "relative flex aspect-square items-center justify-center rounded-xl text-xs font-medium tabular",
                e
                  ? e.nutted
                    ? "bg-pink/20 text-pink"
                    : "bg-lime text-black"
                  : future
                    ? "bg-surface-2/50 text-faint"
                    : isToday
                      ? "bg-surface-2 text-ink"
                      : "bg-surface-2 text-faint line-through decoration-faint/60",
                isToday && "ring-2 ring-lime/60 ring-offset-2 ring-offset-surface",
              )}
            >
              {n}
              {e?.ran && <span className="absolute right-1 bottom-1 size-1.5 rounded-full bg-cyan" />}
            </span>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        <Legend className="bg-lime" label="Clean" />
        <Legend className="bg-pink/40" label="Nutted" />
        <Legend className="bg-surface-2" label="Missed" />
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-cyan" /> Run
        </span>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded", className)} /> {label}
    </span>
  );
}
