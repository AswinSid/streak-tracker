import { Cigarette, Flame, Footprints, Shield, Wine } from "lucide-react";
import type { Rules } from "@/lib/types";
import { IconBadge, type Tone } from "@/components/ui";
import type { LucideIcon } from "lucide-react";

export function RulesList({ rules }: { rules: Rules }) {
  const rows: { icon: LucideIcon; tone: Tone; label: string; hint: string; pts: string }[] = [
    { icon: Shield, tone: "lime", label: "Did not nut", hint: "The main event", pts: `+${rules.no_nut}` },
    { icon: Footprints, tone: "cyan", label: "Went for a run", hint: "Screenshot required", pts: `+${rules.run}` },
    { icon: Wine, tone: "violet", label: "No alcohol", hint: "Stayed dry", pts: `+${rules.no_drink}` },
    { icon: Cigarette, tone: "pink", label: "No smoking", hint: "Lungs say thanks", pts: `+${rules.no_smoke}` },
    {
      icon: Flame,
      tone: "amber",
      label: "Streak bonus",
      hint: `+${rules.streak_bonus_per_day} per clean day in a row, up to +${rules.streak_bonus_cap}`,
      pts: `+${rules.streak_bonus_cap}`,
    },
  ];
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <IconBadge icon={r.icon} tone={r.tone} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium">{r.label}</p>
            <p className="text-xs text-muted">{r.hint}</p>
          </div>
          <span className="tabular font-mono text-[15px] font-semibold">{r.pts}</span>
        </li>
      ))}
    </ul>
  );
}
