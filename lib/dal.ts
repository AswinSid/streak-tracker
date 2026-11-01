import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppStatus, MySummary } from "@/lib/types";

// All functions here read the session cookie: call them inside <Suspense>.

export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

export async function getOwnProfile() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return { userId: null, profile: null };
  const { data } = await supabase
    .from("profiles")
    .select("username, onboarded")
    .eq("id", userId)
    .maybeSingle();
  return { userId, profile: data };
}

// Signed in, has a username, finished onboarding. Otherwise redirects.
export async function requireProfile() {
  const { userId, profile } = await getOwnProfile();
  if (!userId) redirect("/");
  if (!profile || !profile.onboarded) redirect("/onboarding");
  return { userId, username: profile.username };
}

export async function getStatusAndSummary() {
  const supabase = await createClient();
  const [status, summary] = await Promise.all([
    supabase.rpc("app_status"),
    supabase.rpc("get_my_summary"),
  ]);
  if (status.error) throw new Error(status.error.message);
  if (summary.error) throw new Error(summary.error.message);
  return {
    status: status.data as unknown as AppStatus,
    summary: summary.data as unknown as MySummary | null,
  };
}
