"use client";

// Mobile bottom tab bar (master plan Commit 1.7). Every tap target is ≥ 44pt
// (Apple HIG) and the bar is padded with env(safe-area-inset-bottom) so it
// clears the iOS home indicator. Active tab is derived from the pathname.

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const I = {
  stroke: 1.75,
  cls: "size-6",
} as const;

const TABS: Tab[] = [
  {
    href: "/m",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.stroke} className={I.cls} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    href: "/m/leads",
    label: "Leads",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.stroke} className={I.cls} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    href: "/m/replies",
    label: "Replies",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.stroke} className={I.cls} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z" />
      </svg>
    ),
  },
  {
    href: "/m/articles",
    label: "Articles",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.stroke} className={I.cls} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h9l5 5v13H6zM15 3v5h5M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    href: "/m/metrics",
    label: "Metrics",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.stroke} className={I.cls} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/m" ? pathname === "/m" : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-fg hover:text-foreground"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
