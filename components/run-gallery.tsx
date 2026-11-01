"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";
import { screenshotUrl } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import { formatDay } from "@/lib/time";
import { cn } from "@/components/ui";

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
      <ul className="grid grid-cols-2 gap-2.5">
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl border border-line bg-surface text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotUrl(item.screenshot_path)}
                alt={item.username ? `Run by @${item.username} on ${formatDay(item.day)}` : `Run on ${formatDay(item.day)}`}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition group-active:scale-[0.98]"
              />
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 to-transparent px-3 pt-8 pb-2.5">
                {item.username && <span className="block truncate text-sm font-semibold">@{item.username}</span>}
                <span className="block text-xs text-cyan">{formatDay(item.day)}</span>
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
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-[15px] font-medium active:bg-surface-2"
        >
          {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          Load more
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

  const nav = "inline-flex size-12 items-center justify-center rounded-full border border-line bg-surface/90 disabled:opacity-0";

  return (
    <div role="dialog" aria-modal="true" aria-label="Run screenshot" className="animate-rise fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <div className="min-w-0">
          {item.username ? (
            <Link href={`/u/${item.username}`} className="block truncate font-semibold" onClick={onClose}>
              @{item.username}
            </Link>
          ) : null}
          <p className="text-sm text-cyan">{formatDay(item.day)}</p>
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
          className="max-h-full max-w-full rounded-2xl object-contain"
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
