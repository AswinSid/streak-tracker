// Deletes the calling user's account: their run screenshots, then the auth user.
// profiles and checkins rows cascade from auth.users.
// Auth: the caller's access token in the Authorization header, verified here.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "run-screenshots";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "NOT_AUTHENTICATED" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "NOT_AUTHENTICATED" }, 401);
  const uid = userData.user.id;

  // Remove every file in the user's folder (paged, 100 at a time).
  while (true) {
    const { data: files, error } = await admin.storage
      .from(BUCKET)
      .list(uid, { limit: 100 });
    if (error) return json({ error: "STORAGE_LIST_FAILED" }, 500);
    if (!files || files.length === 0) break;
    const { error: removeError } = await admin.storage
      .from(BUCKET)
      .remove(files.map((f) => `${uid}/${f.name}`));
    if (removeError) return json({ error: "STORAGE_REMOVE_FAILED" }, 500);
    if (files.length < 100) break;
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
  if (deleteError) return json({ error: "DELETE_FAILED" }, 500);

  return json({ ok: true });
});
