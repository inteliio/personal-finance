import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGoogleAuth } from "@/lib/google";
import { ensureFinanceSpreadsheet, sheetUrl } from "@/lib/sheets";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const { oauth2, session: fullSession } = await getGoogleAuth();
    const spreadsheetId = await ensureFinanceSpreadsheet(
      oauth2,
      fullSession.spreadsheetId,
    );

    return NextResponse.json({
      authenticated: true,
      user: {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      },
      sheetReady: true,
      spreadsheetId,
      sheetUrl: sheetUrl(spreadsheetId),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve spreadsheet";
    return NextResponse.json(
      {
        authenticated: true,
        user: {
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        },
        sheetReady: false,
        error: message,
      },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
