import type { Category, ExpenseType } from "@/lib/constants";

export type Expense = {
  id: string;
  productName: string;
  amountMkd: number;
  expenseType: ExpenseType;
  createdAt: string;
  category: Category | string;
  subcategory: string;
  note: string;
};

export function parseExpenseRow(row: string[]): Expense | null {
  const [
    id,
    productName,
    amountRaw,
    expenseType,
    createdAt,
    category,
    subcategory,
    note,
  ] = row;

  if (!id?.trim() || !productName?.trim()) return null;

  const amountMkd = Number(amountRaw);
  if (Number.isNaN(amountMkd)) return null;

  return {
    id: id.trim(),
    productName: productName.trim(),
    amountMkd,
    expenseType: (expenseType?.trim() || "need") as ExpenseType,
    createdAt: createdAt?.trim() || "",
    category: category?.trim() || "Other",
    subcategory: subcategory?.trim() || "",
    note: note?.trim() || "",
  };
}
