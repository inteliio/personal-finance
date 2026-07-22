# Personal Finance MVP

Log expenses in a few seconds. Data lives in a Google Spreadsheet named **Personal Finance DB** in your Drive. Built with Next.js (App Router), Auth.js (Google), and the Sheets API.

## Prerequisites

1. A [Google Cloud](https://console.cloud.google.com/) project
2. **APIs enabled:** Google Sheets API and Google Drive API
3. **OAuth consent screen** configured (External or Internal). Add scopes:
   - `openid`, `email`, `profile`
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
4. **OAuth 2.0 Client ID** (application type: Web application)
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

## Setup

```bash
cd ~/Projects/personal-finance
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Description |
|---|---|
| `AUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `AUTH_URL` | App URL, e.g. `http://localhost:3000` |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, and log an expense.

## How it works

- First sign-in requests Sheets + Drive file access.
- On first use (`GET /api/me` or `POST /api/expenses`), the app finds or creates **Personal Finance DB** with an `expenses` tab and header row.
- Each save appends one row: `id`, `product_name`, `amount_mkd`, `expense_type`, `created_at`, `category`, `subcategory`, `note`.
- Use **Open spreadsheet in Drive** to view the sheet.

## API (MVP)

- `POST /api/expenses` — `{ productName, amountMkd, expenseType, category?, subcategory?, note? }` → `{ id, createdAt, spreadsheetId, sheetUrl }`
- `GET /api/me` — session + sheet readiness

Write-only: no list/edit/delete in the UI.

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # run production build
npm run lint     # ESLint
```
