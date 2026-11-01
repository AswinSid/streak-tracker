export const APP_NAME = "NNN League";
export const APP_TAGLINE = "Thirty days. One check-in a night. Climb the board.";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const RUN_BUCKET = "run-screenshots";
export const MAX_UPLOAD_BYTES = 100 * 1024;

export function screenshotUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${RUN_BUCKET}/${path}`;
}
