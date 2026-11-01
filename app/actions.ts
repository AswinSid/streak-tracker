"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Called after a successful check-in so public pages show it right away.
export async function refreshPublicData() {
  updateTag("leaderboard");
  updateTag("runs");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Called after the delete-account Edge Function succeeds.
export async function afterAccountDeleted() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  updateTag("leaderboard");
  updateTag("runs");
}
