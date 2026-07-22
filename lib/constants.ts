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
  "subcategory",
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

export const SUBCATEGORIES: Record<Category, readonly string[]> = {
  Food: ["Groceries", "Dining", "Coffee", "Delivery", "Snacks"],
  Transport: ["Fuel", "Public transit", "Taxi", "Parking", "Maintenance"],
  Housing: ["Rent", "Mortgage", "Furniture", "Repairs"],
  Bills: ["Phone", "Internet", "Electricity", "Water", "Subscriptions"],
  Health: ["Pharmacy", "Doctor", "Dental", "Fitness"],
  Entertainment: ["Streaming", "Events", "Hobbies", "Games"],
  Shopping: ["Clothing", "Electronics", "Home goods", "Gifts"],
  Other: ["Misc"],
};

export function getSubcategories(category: Category): readonly string[] {
  return SUBCATEGORIES[category];
}

export function isValidSubcategory(
  category: Category,
  subcategory: string | undefined,
): boolean {
  if (!subcategory) return true;
  return SUBCATEGORIES[category].includes(subcategory);
}

export const TIMEZONE = "Europe/Skopje";
