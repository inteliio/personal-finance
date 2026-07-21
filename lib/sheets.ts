import {
  APP_PROPERTY_KEY,
  APP_PROPERTY_VALUE,
  EXPENSE_HEADERS,
  EXPENSES_TAB,
  SHEET_TITLE,
} from "@/lib/constants";
import {
  getDriveClient,
  getSheetsClient,
  type GoogleOAuthClient,
} from "@/lib/google";

async function findExistingSpreadsheet(
  authClient: GoogleOAuthClient,
): Promise<string | null> {
  const drive = getDriveClient(authClient);
  const query = [
    `appProperties has { key='${APP_PROPERTY_KEY}' and value='${APP_PROPERTY_VALUE}' }`,
    "mimeType='application/vnd.google-apps.spreadsheet'",
    "trashed=false",
  ].join(" and ");

  const byProperty = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    pageSize: 1,
    spaces: "drive",
  });

  if (byProperty.data.files?.[0]?.id) {
    return byProperty.data.files[0].id;
  }

  const byName = await drive.files.list({
    q: `name='${SHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: "files(id, name)",
    pageSize: 1,
    spaces: "drive",
  });

  const existingId = byName.data.files?.[0]?.id;
  if (!existingId) return null;

  await drive.files.update({
    fileId: existingId,
    requestBody: {
      appProperties: {
        [APP_PROPERTY_KEY]: APP_PROPERTY_VALUE,
      },
    },
  });

  return existingId;
}

async function createSpreadsheet(authClient: GoogleOAuthClient): Promise<string> {
  const sheets = getSheetsClient(authClient);
  const drive = getDriveClient(authClient);

  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: SHEET_TITLE },
      sheets: [
        {
          properties: { title: EXPENSES_TAB },
        },
      ],
    },
    fields: "spreadsheetId",
  });

  const spreadsheetId = created.data.spreadsheetId;
  if (!spreadsheetId) {
    throw new Error("Failed to create spreadsheet");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${EXPENSES_TAB}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [Array.from(EXPENSE_HEADERS)],
    },
  });

  await drive.files.update({
    fileId: spreadsheetId,
    requestBody: {
      appProperties: {
        [APP_PROPERTY_KEY]: APP_PROPERTY_VALUE,
      },
    },
  });

  return spreadsheetId;
}

/** Find or create the Personal Finance DB spreadsheet; returns spreadsheetId. */
export async function ensureFinanceSpreadsheet(
  authClient: GoogleOAuthClient,
  knownId?: string | null,
): Promise<string> {
  if (knownId) {
    try {
      const drive = getDriveClient(authClient);
      await drive.files.get({ fileId: knownId, fields: "id" });
      return knownId;
    } catch {
      // Fall through to find/create if stored id is stale
    }
  }

  const existing = await findExistingSpreadsheet(authClient);
  if (existing) return existing;
  return createSpreadsheet(authClient);
}

export function sheetUrl(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}
