import { TIMEZONE, type Category, type ExpenseType } from "@/lib/constants";
import type { Expense } from "@/lib/expenses";

export type ExpenseFilters = {
  category: Category | "all";
  expenseType: ExpenseType | "all";
  search: string;
  /** `all` | `YYYY-MM` in Europe/Skopje calendar */
  month: "all" | string;
};

/** Calendar year-month for an expense in the app timezone (e.g. "2026-07"). */
export function expenseYearMonth(createdAt: string): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  if (!year || !month) return null;
  return `${year}-${month}`;
}

export function currentYearMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${year}-${month}`;
}

export function filterExpenses(
  expenses: Expense[],
  filters: ExpenseFilters,
): Expense[] {
  const query = filters.search.trim().toLowerCase();

  return expenses.filter((expense) => {
    if (filters.category !== "all" && expense.category !== filters.category) {
      return false;
    }
    if (filters.expenseType !== "all" && expense.expenseType !== filters.expenseType) {
      return false;
    }
    if (query && !expense.productName.toLowerCase().includes(query)) {
      return false;
    }
    if (filters.month !== "all") {
      const ym = expenseYearMonth(expense.createdAt);
      if (ym !== filters.month) return false;
    }
    return true;
  });
}

export function sumAmounts(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amountMkd, 0);
}

/** Distinct year-months present in expenses, newest first. */
export function availableYearMonths(expenses: Expense[]): string[] {
  const months = new Set<string>();
  for (const expense of expenses) {
    const ym = expenseYearMonth(expense.createdAt);
    if (ym) months.add(ym);
  }
  return [...months].sort((a, b) => b.localeCompare(a));
}

export function formatYearMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return yearMonth;
  // Mid-month noon UTC avoids DST edge cases for label formatting
  const date = new Date(Date.UTC(year, month - 1, 15, 12));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    month: "long",
    year: "numeric",
  }).format(date);
}
