"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type Props = {
  title: string;
  userName?: string | null;
};

const NAV = [
  { href: "/", label: "New expense" },
  { href: "/transactions", label: "Transactions" },
] as const;

export function AppHeader({ title, userName }: Props) {
  const pathname = usePathname();

  return (
    <header className="mb-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
            Personal Finance
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight">
            {title}
          </h1>
          {userName ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{userName}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="shrink-0 text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
        >
          Sign out
        </button>
      </div>

      <nav className="flex gap-1 rounded-lg bg-[var(--chip)] p-1">
        {NAV.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition ${
                active
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
