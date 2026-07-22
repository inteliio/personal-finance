import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  CATEGORIES,
  EXPENSE_TYPES,
  EXPENSES_TAB,
  TIMEZONE,
  isValidSubcategory,
  type Category,
  type ExpenseType,
} from "@/lib/constants";
import { getGoogleAuth, getSheetsClient } from "@/lib/google";
import { ensureFinanceSpreadsheet, sheetUrl } from "@/lib/sheets";

type ExpenseBody = {
  productName?: string;
  amountMkd?: number | string;
  expenseType?: string;
  category?: string;
  subcategory?: string;
  note?: string;
};

function nowInSkopje(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .replace(" ", "T");
}

export async function POST(request: Request) {
  let body: ExpenseBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const productName = body.productName?.trim();
  const amount =
    typeof body.amountMkd === "string"
      ? Number(body.amountMkd)
      : body.amountMkd;
  const expenseType = body.expenseType as ExpenseType | undefined;
  const category = (body.category?.trim() || "Other") as Category;
  const subcategory = body.subcategory?.trim() || "";
  const note = body.note?.trim() || "";

  if (!productName) {
    return NextResponse.json(
      { error: "productName is required" },
      { status: 400 },
    );
  }
  if (amount === undefined || Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "amountMkd must be a positive number" },
      { status: 400 },
    );
  }
  if (!expenseType || !EXPENSE_TYPES.includes(expenseType)) {
    return NextResponse.json(
      { error: `expenseType must be one of: ${EXPENSE_TYPES.join(", ")}` },
      { status: 400 },
    );
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }
  if (!isValidSubcategory(category, subcategory || undefined)) {
    return NextResponse.json(
      { error: `subcategory is not valid for category ${category}` },
      { status: 400 },
    );
  }

  try {
    const { oauth2, session } = await getGoogleAuth();
    const spreadsheetId = await ensureFinanceSpreadsheet(
      oauth2,
      session.spreadsheetId,
    );
    const sheets = getSheetsClient(oauth2);

    const id = randomUUID();
    const createdAt = nowInSkopje();

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${EXPENSES_TAB}!A:H`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            id,
            productName,
            amount,
            expenseType,
            createdAt,
            category,
            subcategory,
            note,
          ],
        ],
      },
    });

    return NextResponse.json({
      id,
      createdAt,
      spreadsheetId,
      sheetUrl: sheetUrl(spreadsheetId),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save expense";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
