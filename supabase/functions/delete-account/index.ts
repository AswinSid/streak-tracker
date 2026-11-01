// Deletes the calling user's account: their run screenshots, then the auth user.
// profiles and checkins rows cascade from auth.users.
// Auth: the caller's access token in the Authorization header, verified here
// (deployed with verify_jwt off so the gateway doesn't need to understand the
// project's JWT signing keys).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "run-screenshots";

// Echo the headers the browser asks for in the preflight. supabase-js adds
// headers (x-region, x-supabase-*, ...) that a fixed list would block, and a
// blocked preflight means the POST is never sent.
function corsFor(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      req.headers.get("Access-Control-Request-Headers") ??
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "NOT_AUTHENTICATED" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    console.error("getUser failed", userError?.message);
    return json({ error: "NOT_AUTHENTICATED" }, 401);
  }
  const uid = userData.user.id;

  // Remove every file in the user's folder (paged, 100 at a time).
  while (true) {
    const { data: files, error } = await admin.storage
      .from(BUCKET)
      .list(uid, { limit: 100 });
    if (error) {
      console.error("storage list failed", error.message);
      return json({ error: "STORAGE_LIST_FAILED" }, 500);
    }
    if (!files || files.length === 0) break;
    const { error: removeError } = await admin.storage
      .from(BUCKET)
      .remove(files.map((f) => `${uid}/${f.name}`));
    if (removeError) {
      console.error("storage remove failed", removeError.message);
      return json({ error: "STORAGE_REMOVE_FAILED" }, 500);
    }
    if (files.length < 100) break;
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
  if (deleteError) {
    console.error("deleteUser failed", deleteError.message);
    return json({ error: "DELETE_FAILED" }, 500);
  }

  return json({ ok: true });
});
