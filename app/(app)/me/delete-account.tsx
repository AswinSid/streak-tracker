"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import { afterAccountDeleted } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { buttonSecondary, cn } from "@/components/ui";

export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function del() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.functions.invoke("delete-account", { method: "POST" });
    if (error) {
      setError("Could not delete your account. Try again.");
      setBusy(false);
      return;
    }
    await afterAccountDeleted();
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-medium text-pink active:bg-pink/10"
      >
        <Trash2 className="size-4" aria-hidden /> Delete account and data
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="animate-rise pb-safe mx-auto w-full max-w-md rounded-t-3xl border-t border-line bg-surface px-5 pt-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-pink/15 text-pink">
                <TriangleAlert className="size-5" aria-hidden />
              </span>
              <h2 id="delete-title" className="text-lg font-semibold">
                Delete everything?
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              This permanently removes your account, username, every check-in and all your run
              screenshots. Your points leave the leaderboard. This cannot be undone.
            </p>
            <label htmlFor="confirm-delete" className="mt-5 block text-sm text-muted">
              Type <b className="text-ink">DELETE</b> to confirm
            </label>
            <input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              className="mt-2 h-14 w-full rounded-2xl border border-line bg-surface-2 px-4 text-base outline-none focus:border-pink"
            />
            {error && <p className="mt-2 text-sm text-pink">{error}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3 pb-5">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className={buttonSecondary}>
                Cancel
              </button>
              <button
                type="button"
                onClick={del}
                disabled={confirmText !== "DELETE" || busy}
                className={cn(
                  "inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-pink font-semibold text-black transition active:scale-[0.98] disabled:opacity-40",
                )}
              >
                {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
