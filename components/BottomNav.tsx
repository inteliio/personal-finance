"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AddIcon, ListIcon } from "@/components/NavIcons";
import { APP_NAV } from "@/lib/nav";

const ICONS = {
  add: AddIcon,
  list: ListIcon,
} as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex h-[var(--nav-height)] max-w-lg">
        {APP_NAV.map(({ href, shortLabel, icon }) => {
          const active = pathname === href;
          const Icon = ICONS[icon];
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className="shrink-0" />
                <span>{shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
