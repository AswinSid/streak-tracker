// Shapes of the JSON returned by the DB functions.

export type Rules = {
  no_nut: number;
  run: number;
  no_drink: number;
  no_smoke: number;
  streak_bonus_per_day: number;
  streak_bonus_cap: number;
};

export type AppStatus = {
  now: string;
  today: string;
  season_state: "upcoming" | "active" | "ended";
  season_start: string;
  season_end: string;
  window_open: boolean;
  opens_at: string;
  closes_at: string;
  next_opens_at: string | null;
  rules: Rules;
};

export type DayEntry = {
  day: string;
  points: number;
  streak: number;
  nutted: boolean;
  drank: boolean;
  smoked: boolean;
  ran: boolean;
  screenshot_path?: string | null;
};

export type MySummary = {
  username: string;
  joined_at: string;
  joined_day: string;
  rank: number;
  total_users: number;
  points: number;
  current_streak: number;
  no_nut_days: number;
  runs: number;
  days_logged: number;
  today: DayEntry | null;
  history: DayEntry[];
  /** Past days a late joiner can still fill in (oldest first). */
  backfill_days: string[];
};

export type BackfillResult = { filled: number; points: number };

export type CheckinResult = {
  day: string;
  points: number;
  streak: number;
  breakdown: {
    no_nut: number;
    run: number;
    no_drink: number;
    no_smoke: number;
    streak_bonus: number;
  };
};

export type LeaderboardRow = {
  rank: number;
  username: string;
  points: number;
  current_streak: number;
  no_nut_days: number;
  runs: number;
  days_logged: number;
};

export type RunPost = {
  id: number;
  username: string;
  day: string;
  screenshot_path: string;
  created_at: string;
};

export type PublicProfile = {
  username: string;
  joined_at: string;
  rank: number;
  points: number;
  current_streak: number;
  no_nut_days: number;
  runs: number;
  days_logged: number;
  run_list: { id: number; day: string; screenshot_path: string }[];
};
