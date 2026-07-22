import { describe, expect, it } from "vitest";
import { parseExpenseRow } from "@/lib/expenses";

describe("parseExpenseRow", () => {
  it("parses a full valid row", () => {
    const expense = parseExpenseRow([
      "abc-123",
      "  Coffee  ",
      "150",
      "need",
      "2026-07-22T10:00:00+02:00",
      "Food",
      "Coffee",
      "Morning stop",
    ]);

    expect(expense).toEqual({
      id: "abc-123",
      productName: "Coffee",
      amountMkd: 150,
      expenseType: "need",
      createdAt: "2026-07-22T10:00:00+02:00",
      category: "Food",
      subcategory: "Coffee",
      note: "Morning stop",
    });
  });

  it("returns null when id is missing", () => {
    expect(
      parseExpenseRow(["", "Coffee", "150", "need", "", "Food", "", ""]),
    ).toBeNull();
  });

  it("returns null when product name is missing", () => {
    expect(
      parseExpenseRow(["abc-123", "  ", "150", "need", "", "Food", "", ""]),
    ).toBeNull();
  });

  it("returns null when amount is not a number", () => {
    expect(
      parseExpenseRow(["abc-123", "Coffee", "abc", "need", "", "Food", "", ""]),
    ).toBeNull();
  });

  it("defaults missing optional fields", () => {
    const expense = parseExpenseRow(["abc-123", "Coffee", "99"]);

    expect(expense).toEqual({
      id: "abc-123",
      productName: "Coffee",
      amountMkd: 99,
      expenseType: "need",
      createdAt: "",
      category: "Other",
      subcategory: "",
      note: "",
    });
  });

  it("accepts zero as a valid amount", () => {
    const expense = parseExpenseRow(["abc-123", "Free sample", "0"]);
    expect(expense?.amountMkd).toBe(0);
  });
});
