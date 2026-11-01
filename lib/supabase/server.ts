import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "@/lib/database.types";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";

// Request-scoped client that carries the user's session cookies.
// Reads cookies, so it must only be used inside a <Suspense> boundary,
// a Route Handler or a Server Action.
export async function createClient() {
  const cookieStore = await cookies();
  // The client checks the session token's expiry against Date.now(). Cookies
  // alone don't stop prerendering (runtime prefetches resolve them), so wait
  // for a real request before any clock read.
  await connection();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}
