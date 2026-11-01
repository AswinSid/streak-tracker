import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { AppStatus, LeaderboardRow, PublicProfile, RunPost, Rules } from "@/lib/types";

// Points table only (no clock values), so it is safe to cache for a long time.
export async function getRules(): Promise<Rules> {
  "use cache";
  cacheLife("hours");
  const { data, error } = await createPublicClient().rpc("app_status");
  if (error) throw new Error(error.message);
  return (data as unknown as AppStatus).rules;
}

// Public, cookie-free reads cached on the server for about a minute.
// Check-in submissions call updateTag() on these tags to refresh immediately.

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("leaderboard");
  const { data, error } = await createPublicClient().rpc("get_leaderboard", { p_limit: 100 });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getRunFeedFirstPage(): Promise<RunPost[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("runs");
  const { data, error } = await createPublicClient().rpc("get_run_feed", { p_limit: 24 });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("leaderboard", "runs");
  const { data, error } = await createPublicClient().rpc("get_public_profile", {
    p_username: username,
  });
  if (error) throw new Error(error.message);
  return (data as unknown as PublicProfile | null) ?? null;
}
