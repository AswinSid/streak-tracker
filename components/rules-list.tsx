import { Cigarette, Flame, Footprints, Shield, Wine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Rules } from "@/lib/types";
import { IconBadge, cn, tones, type Tone } from "@/components/ui";

export function RulesList({ rules }: { rules: Rules }) {
  const rows: { icon: LucideIcon; tone: Tone; label: string; hint: string; pts: string }[] = [
    { icon: Shield, tone: "lime", label: "didn't nut", hint: "the main event", pts: `+${rules.no_nut}` },
    { icon: Footprints, tone: "cyan", label: "went for a run", hint: "screenshot or it didn't happen", pts: `+${rules.run}` },
    { icon: Wine, tone: "violet", label: "stayed dry", hint: "zero alcohol", pts: `+${rules.no_drink}` },
    { icon: Cigarette, tone: "pink", label: "no smokes", hint: "your lungs say ty", pts: `+${rules.no_smoke}` },
    {
      icon: Flame,
      tone: "amber",
      label: "streak bonus",
      hint: `+${rules.streak_bonus_per_day} per clean day in a row, caps at +${rules.streak_bonus_cap}`,
      pts: `+${rules.streak_bonus_cap}`,
    },
  ];
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-2.5 pr-3">
          <IconBadge icon={r.icon} tone={r.tone} size="sm" tilt={false} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] leading-tight font-extrabold">{r.label}</p>
            <p className="text-xs text-muted">{r.hint}</p>
          </div>
          <span className={cn("tabular font-mono text-base font-bold", tones[r.tone].text)}>{r.pts}</span>
        </li>
      ))}
    </ul>
  );
}
