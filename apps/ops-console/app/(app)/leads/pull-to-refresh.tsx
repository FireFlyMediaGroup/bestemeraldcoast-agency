"use client";

// Pull-to-refresh for the operator on mobile (Apple HIG — master plan Commit
// 1.6). Only engages when the page is scrolled to the very top and the
// gesture is a deliberate downward pull past a threshold; it then triggers a
// server re-render via router.refresh(). router.refresh() resolves no
// promise, so the spinner is cleared on the next paint after the refreshed
// RSC payload commits (a short transition window) — acceptable for an
// internal tool. prefers-reduced-motion is honored globally (globals.css).

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const THRESHOLD = 70;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!refreshing) return;
    // Heuristic: the refreshed server payload commits within a short window;
    // clear the indicator then. The operator can pull again if stale.
    const t = setTimeout(() => setRefreshing(false), 700);
    return () => clearTimeout(t);
  }, [refreshing]);

  function onTouchStart(e: React.TouchEvent) {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0]?.clientY ?? null;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startY.current == null) return;
    const dy = (e.touches[0]?.clientY ?? 0) - startY.current;
    setPull(dy > 0 ? Math.min(dy, THRESHOLD * 1.5) : 0);
  }

  function onTouchEnd() {
    if (startY.current != null && pull >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      router.refresh();
    }
    startY.current = null;
    setPull(0);
  }

  const active = refreshing || pull > 0;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        aria-hidden={!active}
        className="overflow-hidden text-center text-sm text-muted-fg transition-[height] duration-150"
        style={{ height: active ? 28 : 0 }}
      >
        {refreshing
          ? "Refreshing…"
          : pull >= THRESHOLD
            ? "Release to refresh"
            : "Pull to refresh"}
      </div>
      {children}
    </div>
  );
}
