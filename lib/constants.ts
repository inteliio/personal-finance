export const SHEET_TITLE = "Personal Finance DB";
export const EXPENSES_TAB = "expenses";
export const APP_PROPERTY_KEY = "personalFinanceApp";
export const APP_PROPERTY_VALUE = "v1";

export const EXPENSE_HEADERS = [
  "id",
  "product_name",
  "amount_mkd",
  "expense_type",
  "created_at",
  "category",
  "note",
] as const;

export const EXPENSE_TYPES = ["need", "operating", "luxury"] as const;
export type ExpenseType = (typeof EXPENSE_TYPES)[number];

export const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Bills",
  "Health",
  "Entertainment",
  "Shopping",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const TIMEZONE = "Europe/Skopje";
