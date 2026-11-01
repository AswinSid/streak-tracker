const MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "Your session expired. Sign in again.",
  USERNAME_INVALID: "Use 3 to 20 letters, numbers or underscores.",
  USERNAME_TAKEN: "That username is not available.",
  NO_PROFILE: "Pick a username first.",
  MISSING_ANSWERS: "Answer every question first.",
  SEASON_NOT_ACTIVE: "Check-ins are only open from November 1 to 30.",
  WINDOW_CLOSED: "Check-ins open at 9:00 PM IST and close at 11:59 PM IST.",
  ALREADY_CHECKED_IN: "You already checked in today.",
  SCREENSHOT_REQUIRED: "Upload your run screenshot to continue.",
  SCREENSHOT_ALREADY_USED: "That screenshot was already used. Upload a new one.",
  BACKFILL_NOT_ALLOWED: "One of those days can't be filled in anymore. Refresh and try again.",
  NOT_AN_IMAGE: "That file is not an image.",
  COMPRESSION_FAILED: "Could not shrink that image. Try a different screenshot.",
};

export function friendlyError(error: unknown): string {
  const raw =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";
  for (const code of Object.keys(MESSAGES)) {
    if (raw.includes(code)) return MESSAGES[code];
  }
  return "Something went wrong. Try again.";
}
