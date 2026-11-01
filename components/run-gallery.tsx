"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";
import { screenshotUrl } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import { formatDay } from "@/lib/time";
import { cn } from "@/components/ui";

const TILTS = ["-rotate-2", "rotate-1", "rotate-2", "-rotate-1"];

export type GalleryItem = { id: number; day: string; screenshot_path: string; username?: string; created_at?: string };

export function RunGallery({
  initial,
  paginate = false,
  pageSize = 24,
}: {
  initial: GalleryItem[];
  paginate?: boolean;
  pageSize?: number;
}) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initial.length < pageSize);

  async function loadMore() {
    const last = items[items.length - 1];
    if (!last?.created_at) return;
    setLoading(true);
    const { data } = await createClient().rpc("get_run_feed", { p_before: last.created_at, p_limit: pageSize });
    setLoading(false);
    const next = data ?? [];
    setItems((cur) => [...cur, ...next.filter((n) => !cur.some((c) => c.id === n.id))]);
    if (next.length < pageSize) setDone(true);
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-x-5">
        {items.map((item, i) => (
          <li key={item.id} className={TILTS[i % TILTS.length]}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="press block w-full rounded-[18px] border-2 border-black bg-ink p-1.5 pb-0 text-left text-black hard-ink"
            >
              <span className="block aspect-3/4 overflow-hidden rounded-xl bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotUrl(item.screenshot_path)}
                  alt={item.username ? `Run by @${item.username} on ${formatDay(item.day)}` : `Run on ${formatDay(item.day)}`}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </span>
              <span className="flex items-center justify-between gap-2 px-1.5 py-2">
                <span className="min-w-0 truncate text-sm font-extrabold">
                  {item.username ? `@${item.username}` : "run"}
                </span>
                <span className="shrink-0 font-mono text-[11px] font-bold opacity-60">{formatDay(item.day)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {paginate && !done && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="press mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-surface-2 text-[15px] font-extrabold hard-sm-ink"
        >
          {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          load more receipts
        </button>
      )}

      {open !== null && items[open] && (
        <Lightbox
          item={items[open]}
          hasPrev={open > 0}
          hasNext={open < items.length - 1}
          onPrev={() => setOpen(open - 1)}
          onNext={() => setOpen(open + 1)}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  item,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
}: {
  item: GalleryItem;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [hasPrev, hasNext, onPrev, onNext, onClose]);

  const nav =
    "press inline-flex size-12 items-center justify-center rounded-full border-2 border-black bg-cyan text-black hard-sm-ink disabled:invisible";

  return (
    <div role="dialog" aria-modal="true" aria-label="Run screenshot" className="animate-rise fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <div className="min-w-0">
          {item.username ? (
            <Link href={`/u/${item.username}`} className="block truncate text-lg font-extrabold" onClick={onClose}>
              @{item.username}
            </Link>
          ) : null}
          <p className="font-mono text-sm font-bold text-cyan">{formatDay(item.day)}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className={nav}>
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3" onClick={onClose}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshotUrl(item.screenshot_path)}
          alt=""
          className="max-h-full max-w-full rounded-2xl border-2 border-ink object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex items-center justify-center gap-4 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <button type="button" onClick={onPrev} disabled={!hasPrev} aria-label="Previous" className={nav}>
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <button type="button" onClick={onNext} disabled={!hasNext} aria-label="Next" className={cn(nav)}>
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
