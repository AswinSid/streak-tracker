# NNN League

A mobile-first, gamified No Nut November tracker. Users sign in with Google, pick a unique username,
and check in once a night (9:00 PM to 11:59 PM IST, November 1 to 30). They answer four questions and
earn points. Runs need a screenshot, which is compressed on the device to 100 KB or less. There is a
public top-100 leaderboard and a public run gallery.

## Stack

- Next.js 16 (App Router, Cache Components, `proxy.ts`), Tailwind CSS 4, lucide-react
- Supabase: Postgres (RLS + RPC functions), Auth (Google), Storage (`run-screenshots`), one Edge
  Function (`delete-account`)

## Points

Points are defined in the `private.rules()` SQL function, and the UI reads them from there.

| Item                         | Points                                     |
| ---------------------------- | ------------------------------------------ |
| Did not nut                  | +50                                        |
| Ran (screenshot required)    | +30                                        |
| No alcohol                   | +10                                        |
| No smoking                   | +10                                        |
| Streak bonus                 | +2 per prior clean day in a row, max +20   |

## Where things live

| Path                                    | What                                                          |
| --------------------------------------- | ------------------------------------------------------------- |
| `supabase/migrations/`                  | Full DB schema, RLS, storage bucket and RPC functions         |
| `supabase/functions/delete-account/`    | Edge Function: deletes the caller's screenshots and account   |
| `proxy.ts`, `lib/supabase/`             | Session refresh, route guards, Supabase clients               |
| `lib/dal.ts`, `lib/public-data.ts`      | Server data access (session-bound and cached public reads)    |
| `lib/compress-image.ts`                 | On-device screenshot compression                              |
| `app/(app)/today/checkin-flow.tsx`      | Nightly check-in UI                                           |

Season dates, opening time and points are SQL functions in the `private` schema
(`season_start`, `season_end`, `opens_at_time`, `rules`).

## Local development

```bash
cp .env.example .env.local   # fill in the two values from Supabase > Project Settings > API
bun install
bun dev
```

## Regenerate DB types

Use the Supabase MCP `generate_typescript_types` tool or `supabase gen types typescript`, then
update `lib/database.types.ts`.
