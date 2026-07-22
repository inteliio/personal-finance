"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import {
  CATEGORIES,
  EXPENSE_TYPES,
  TIMEZONE,
  type Category,
  type ExpenseType,
} from "@/lib/constants";
import type { Expense } from "@/lib/expenses";
import {
  availableYearMonths,
  currentYearMonth,
  filterExpenses,
  formatYearMonthLabel,
  sumAmounts,
} from "@/lib/transactions";

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

function formatDateShort(createdAt: string): string {
  if (!createdAt) return "—";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function TransactionsList({ userName }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<Category | "all">("all");
  const [expenseType, setExpenseType] = useState<ExpenseType | "all">("all");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState<"all" | string>("all");

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

  const thisMonthKey = currentYearMonth();
  const months = useMemo(() => availableYearMonths(expenses), [expenses]);

  const filtered = useMemo(
    () =>
      filterExpenses(expenses, {
        category,
        expenseType,
        search,
        month,
      }),
    [expenses, category, expenseType, search, month],
  );

  const filteredTotal = sumAmounts(filtered);
  const thisMonthTotal = sumAmounts(
    filterExpenses(expenses, {
      category: "all",
      expenseType: "all",
      search: "",
      month: thisMonthKey,
    }),
  );
  const allTimeTotal = sumAmounts(expenses);

  const hasActiveFilters =
    category !== "all" || expenseType !== "all" || search.trim() !== "" || month !== "all";

  return (
    <>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)] sm:px-6 sm:py-8 md:max-w-5xl md:pb-8">
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
            <div className="mb-4 grid grid-cols-2 gap-2">
              <SummaryCard label="This month" amount={thisMonthTotal} />
              <SummaryCard label="All time" amount={allTimeTotal} />
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <label className="block">
                <span className="sr-only">Search by product name</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product…"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
                />
              </label>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <FilterSelect
                  label="Month"
                  value={month}
                  onChange={setMonth}
                  options={[
                    { value: "all", label: "All months" },
                    ...months.map((ym) => ({
                      value: ym,
                      label:
                        ym === thisMonthKey
                          ? `${formatYearMonthLabel(ym)} (current)`
                          : formatYearMonthLabel(ym),
                    })),
                  ]}
                />
                <FilterSelect
                  label="Category"
                  value={category}
                  onChange={(value) => setCategory(value as Category | "all")}
                  options={[
                    { value: "all", label: "All categories" },
                    ...CATEGORIES.map((cat) => ({ value: cat, label: cat })),
                  ]}
                />
                <FilterSelect
                  label="Type"
                  value={expenseType}
                  onChange={(value) => setExpenseType(value as ExpenseType | "all")}
                  options={[
                    { value: "all", label: "All types" },
                    ...EXPENSE_TYPES.map((type) => ({
                      value: type,
                      label: type,
                    })),
                  ]}
                />
              </div>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setCategory("all");
                    setExpenseType("all");
                    setSearch("");
                    setMonth("all");
                  }}
                  className="self-start text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
                >
                  Clear filters
                </button>
              ) : null}
            </div>

            <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                {hasActiveFilters ? "Filtered total" : "Showing"}
              </p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight">
                {amountFormatter.format(filteredTotal)}
              </p>
              <p className="mt-0.5 text-sm text-[var(--muted)]">
                {filtered.length} transaction{filtered.length === 1 ? "" : "s"}
                {hasActiveFilters ? ` of ${expenses.length}` : ""}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
                <p className="text-sm text-[var(--muted)]">No transactions match these filters.</p>
              </div>
            ) : (
              <>
                <ul className="flex flex-col gap-2 md:hidden">
                  {filtered.map((expense) => (
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

                <div className="hidden overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] md:block">
                  <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--chip)]">
                        <th className="px-4 py-3 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                          Product
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                          Category
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                          Subcategory
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                          Type
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((expense) => (
                        <tr
                          key={expense.id}
                          className="border-b border-[var(--border)] last:border-b-0"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">
                            {formatDateShort(expense.createdAt)}
                          </td>
                          <td className="max-w-[12rem] truncate px-4 py-3 font-medium">
                            {expense.productName}
                          </td>
                          <td className="px-4 py-3 capitalize">{expense.category}</td>
                          <td className="px-4 py-3 text-[var(--muted)] capitalize">
                            {expense.subcategory || "—"}
                          </td>
                          <td className="px-4 py-3 capitalize">{expense.expenseType}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">
                            {amountFormatter.format(expense.amountMkd)}
                          </td>
                          <td className="max-w-[14rem] truncate px-4 py-3 text-[var(--muted)]">
                            {expense.note || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
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
      <BottomNav />
    </>
  );
}

function SummaryCard({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
        {amountFormatter.format(amount)}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm capitalize outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-[var(--chip)] px-2 py-0.5 text-xs font-medium capitalize text-[var(--foreground)]">
      {label}
    </span>
  );
}
