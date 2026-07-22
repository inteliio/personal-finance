# Personal Finance — Features

Inventory of everything the app supports today. For setup and env vars, see [README.md](../README.md).

**Stack:** Next.js 16 (App Router), React 19, Auth.js v5 (Google), Google Sheets/Drive APIs, Tailwind CSS 4, Vitest.

**Currency & timezone:** Amounts in **MKD**. Dates and month grouping use **Europe/Skopje**.

---

## Overview

Sign in with Google, log expenses in a few taps, and store them in a spreadsheet named **Personal Finance DB** in your Drive. Browse and filter history on a transactions page. Mobile uses a bottom tab bar and card list; desktop uses top tabs and a data table.

---

## Authentication

- **Provider:** Google OAuth via Auth.js (`next-auth`)
- **Scopes:** `openid`, `email`, `profile`, Google Spreadsheets, Drive file access
- **OAuth behavior:** Offline access with consent prompt so a refresh token is available
- **Sign in:** Landing screen → “Sign in with Google”
- **Sign out:** Header control on authenticated pages
- **Session:** JWT strategy; session can include access token, spreadsheet id, and refresh-error flag
- **Token refresh:** Access token refreshed when near expiry; failed refresh surfaces as a session error
- **Route gate:** `/` and `/transactions` show the sign-in landing when there is no authenticated user

---

## Log expense

Page: `/` — `ExpenseForm`

| Field | Behavior |
| --- | --- |
| Amount (MKD) | Required number, autofocus, large display input |
| Product name | Required text |
| Type | Chips: `need`, `operating`, `luxury` (default `need`) |
| Category | Chips from the category list (default `Other`); changing category clears subcategory |
| Subcategory | Optional chips for the selected category; tap again to clear |
| Note | Optional; revealed via “Add note” |

**After a successful save**

- Shows a short success message
- Clears amount, product name, and note
- Keeps type, category, and subcategory for faster re-entry
- Persists last-used `{ expenseType, category, subcategory }` in `localStorage` (`pf-last-expense`) and restores them on next visit

**Spreadsheet**

- Ensures a sheet exists (via `/api/me` or on first save)
- Link: “Open spreadsheet in Drive” when available
- Otherwise: “Spreadsheet is created on first save”

---

## Google Sheets storage

| Detail | Value |
| --- | --- |
| Spreadsheet title | `Personal Finance DB` |
| Tab | `expenses` |
| Drive marker | App property `personalFinanceApp = v1` (preferred over title match) |

**Lifecycle**

1. Prefer spreadsheet id from the session
2. Else find by Drive app property
3. Else find by title (and stamp the app property)
4. Else create spreadsheet + header row

**Header migration:** If an older sheet is missing the `subcategory` column, that column is inserted and headers rewritten.

**Write:** Append a row to `expenses!A:H`  
**Read:** Load `expenses!A2:H`, parse rows, return **newest first**

**Columns**

| Column | Meaning |
| --- | --- |
| `id` | UUID |
| `product_name` | Product |
| `amount_mkd` | Amount |
| `expense_type` | need / operating / luxury |
| `created_at` | Local Skopje timestamp |
| `category` | Category |
| `subcategory` | Optional |
| `note` | Optional |

Sheet URL shape: `https://docs.google.com/spreadsheets/d/{spreadsheetId}`

---

## Transactions

Page: `/transactions` — `TransactionsList`

- Loads expenses from `GET /api/expenses`
- Empty state when there are no rows yet
- **Summaries:** This month total + all-time total (MKD)
- **Search:** Product name (case-insensitive substring)
- **Filters (AND):** Month (`all` or `YYYY-MM`), category, expense type
- Month dropdown built from data (newest first); current month labeled “(current)”
- **Clear filters** when any filter is active
- **Filtered total** + count (`X of Y` when filtered)
- Link to open the spreadsheet in Drive when known

**Responsive results**

| Viewport | Presentation |
| --- | --- |
| Mobile (`< md`) | Card list: name, datetime, amount, type/category/subcategory tags, note |
| Desktop (`md+`) | Table: Date, Product, Category, Subcategory, Type, Amount, Note |

---

## UI shell & theme

- **Mobile:** Fixed bottom nav — **Add** and **Transactions** (icon + label), with safe-area padding
- **Desktop:** Top segmented tabs in the header (“New expense” / “Transactions”); bottom nav hidden
- **Header:** Brand eyebrow “Personal Finance”, page title, optional user name, Sign out
- **Fonts:** DM Sans (display), IBM Plex Sans (body)
- **Theme:** Flat ink & stone (light only) — zinc background, navy accent, white surfaces; no body gradient
- **Widths:** Expense form `max-w-lg`; transactions `max-w-2xl` / `md:max-w-5xl`

---

## Pages

| Path | When signed out | When signed in |
| --- | --- | --- |
| `/` | Sign-in landing | New expense form |
| `/transactions` | Sign-in landing | Transactions list / table |

---

## API

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | GET, POST | Auth.js handlers |
| `/api/me` | GET | Auth check + ensure spreadsheet; returns user + sheet ids/URL (or `sheetReady: false` + error) |
| `/api/expenses` | GET | List expenses (newest first) + spreadsheet id/URL |
| `/api/expenses` | POST | Create expense |

**POST `/api/expenses` body**

- `productName` (required)
- `amountMkd` (required, positive number)
- `expenseType` (required, must be a known type)
- `category` (optional; defaults to `Other` if omitted/invalid)
- `subcategory` (optional; must be valid for the category)
- `note` (optional)

Unauthenticated requests return **401**.

---

## Data model

**Expense types:** `need`, `operating`, `luxury`

**Categories:** Food, Transport, Housing, Bills, Health, Entertainment, Shopping, Other

**Subcategories (by category)**

| Category | Subcategories |
| --- | --- |
| Food | Groceries, Dining, Coffee, Delivery, Snacks |
| Transport | Fuel, Public transit, Taxi, Parking, Maintenance |
| Housing | Rent, Mortgage, Furniture, Repairs |
| Bills | Phone, Internet, Electricity, Water, Subscriptions |
| Health | Pharmacy, Doctor, Dental, Fitness |
| Entertainment | Streaming, Events, Hobbies, Games |
| Shopping | Clothing, Electronics, Home goods, Gifts |
| Other | Misc |

**In-app `Expense` shape:** `id`, `productName`, `amountMkd`, `expenseType`, `createdAt`, `category`, `subcategory`, `note`

**Parse defaults when reading sheet rows:** missing type → `need`; missing category → `Other`; empty strings for missing date / subcategory / note.

---

## Tooling & tests

**Scripts:** `dev`, `build`, `start`, `lint`, `test`, `test:watch`

**Unit tests (Vitest)** cover pure logic only:

- Categories / subcategory helpers (`lib/constants`)
- Sheet row parsing (`lib/expenses`)
- Filters, month keys, sums, month labels (`lib/transactions`)

No component, API route, or E2E tests yet.

---

## Not included yet

These are not built: edit/delete expenses, income, budgets, insights/charts, multi-account balances, CSV export, dark mode, pagination.
