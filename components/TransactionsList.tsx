"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { TIMEZONE } from "@/lib/constants";
import type { Expense } from "@/lib/expenses";

type ExpensesResponse = {
  expenses?: Expense[];
  sheetUrl?: string;
  error?: string;
};

type Props = {
  userName?: string | null;
};

const amountFormatter = new Intl.NumberFormat("en-MK", {
  style: "currency",
  currency: "MKD",
  maximumFractionDigits: 0,
});

function formatDate(createdAt: string): string {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function TransactionsList({ userName }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/expenses");
        const data = (await res.json()) as ExpensesResponse;
        if (!res.ok) {
          throw new Error(data.error || "Failed to load transactions");
        }
        if (cancelled) return;
        setExpenses(data.expenses ?? []);
        setSheetUrl(data.sheetUrl ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load transactions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = expenses.reduce((sum, expense) => sum + expense.amountMkd, 0);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
      <AppHeader title="Transactions" userName={userName} />

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading transactions…</p>
      ) : error ? (
        <p className="text-sm font-medium text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : expenses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--muted)]">No transactions yet.</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Log your first expense to see it here.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
              Total
            </p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight">
              {amountFormatter.format(total)}
            </p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              {expenses.length} transaction{expenses.length === 1 ? "" : "s"}
            </p>
          </div>

          <ul className="flex flex-col gap-2">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{expense.productName}</p>
                    <p className="mt-0.5 text-sm text-[var(--muted)]">
                      {formatDate(expense.createdAt)}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-semibold tabular-nums">
                    {amountFormatter.format(expense.amountMkd)}
                  </p>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Tag label={expense.expenseType} />
                  <Tag label={expense.category} />
                  {expense.subcategory ? <Tag label={expense.subcategory} /> : null}
                </div>

                {expense.note ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">{expense.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}

      {sheetUrl ? (
        <a
          href={sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 text-center text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
        >
          Open spreadsheet in Drive
        </a>
      ) : null}
    </main>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-[var(--chip)] px-2 py-0.5 text-xs font-medium capitalize text-[var(--foreground)]">
      {label}
    </span>
  );
}
