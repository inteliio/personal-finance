import { describe, expect, it } from "vitest";
import type { Expense } from "@/lib/expenses";
import {
  availableYearMonths,
  currentYearMonth,
  expenseYearMonth,
  filterExpenses,
  formatYearMonthLabel,
  sumAmounts,
} from "@/lib/transactions";

function expense(partial: Partial<Expense> & Pick<Expense, "id" | "productName">): Expense {
  return {
    amountMkd: 100,
    expenseType: "need",
    createdAt: "2026-07-15T12:00:00+02:00",
    category: "Food",
    subcategory: "",
    note: "",
    ...partial,
  };
}

describe("expenseYearMonth", () => {
  it("returns YYYY-MM in Europe/Skopje", () => {
    expect(expenseYearMonth("2026-07-22T10:00:00+02:00")).toBe("2026-07");
  });

  it("returns null for empty or invalid dates", () => {
    expect(expenseYearMonth("")).toBeNull();
    expect(expenseYearMonth("not-a-date")).toBeNull();
  });
});

describe("filterExpenses", () => {
  const rows = [
    expense({
      id: "1",
      productName: "Coffee",
      category: "Food",
      expenseType: "need",
      amountMkd: 150,
      createdAt: "2026-07-10T09:00:00+02:00",
    }),
    expense({
      id: "2",
      productName: "Bus ticket",
      category: "Transport",
      expenseType: "operating",
      amountMkd: 80,
      createdAt: "2026-07-12T09:00:00+02:00",
    }),
    expense({
      id: "3",
      productName: "Fancy dinner",
      category: "Food",
      expenseType: "luxury",
      amountMkd: 2000,
      createdAt: "2026-06-20T09:00:00+02:00",
    }),
  ];

  it("filters by category", () => {
    const result = filterExpenses(rows, {
      category: "Food",
      expenseType: "all",
      search: "",
      month: "all",
    });
    expect(result.map((e) => e.id)).toEqual(["1", "3"]);
  });

  it("filters by expense type", () => {
    const result = filterExpenses(rows, {
      category: "all",
      expenseType: "operating",
      search: "",
      month: "all",
    });
    expect(result.map((e) => e.id)).toEqual(["2"]);
  });

  it("searches product name case-insensitively", () => {
    const result = filterExpenses(rows, {
      category: "all",
      expenseType: "all",
      search: "coffee",
      month: "all",
    });
    expect(result.map((e) => e.id)).toEqual(["1"]);
  });

  it("filters by month", () => {
    const result = filterExpenses(rows, {
      category: "all",
      expenseType: "all",
      search: "",
      month: "2026-06",
    });
    expect(result.map((e) => e.id)).toEqual(["3"]);
  });

  it("combines filters with AND logic", () => {
    const result = filterExpenses(rows, {
      category: "Food",
      expenseType: "need",
      search: "cof",
      month: "2026-07",
    });
    expect(result.map((e) => e.id)).toEqual(["1"]);
  });
});

describe("sumAmounts", () => {
  it("sums amounts", () => {
    expect(
      sumAmounts([
        expense({ id: "1", productName: "A", amountMkd: 10 }),
        expense({ id: "2", productName: "B", amountMkd: 25 }),
      ]),
    ).toBe(35);
  });
});

describe("availableYearMonths", () => {
  it("returns distinct months newest first", () => {
    const months = availableYearMonths([
      expense({ id: "1", productName: "A", createdAt: "2026-06-01T12:00:00+02:00" }),
      expense({ id: "2", productName: "B", createdAt: "2026-07-01T12:00:00+02:00" }),
      expense({ id: "3", productName: "C", createdAt: "2026-07-15T12:00:00+02:00" }),
    ]);
    expect(months).toEqual(["2026-07", "2026-06"]);
  });
});

describe("formatYearMonthLabel", () => {
  it("formats a readable month label", () => {
    expect(formatYearMonthLabel("2026-07")).toMatch(/July 2026/);
  });
});

describe("currentYearMonth", () => {
  it("returns YYYY-MM for a fixed instant", () => {
    expect(currentYearMonth(new Date("2026-07-22T12:00:00+02:00"))).toBe("2026-07");
  });
});
