import { google } from "googleapis";
import { auth } from "@/auth";

export function createOAuthClient(accessToken: string) {
  const oauth2 = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
  );
  oauth2.setCredentials({
    access_token: accessToken,
  });
  return oauth2;
}

export type GoogleOAuthClient = ReturnType<typeof createOAuthClient>;

export async function getGoogleAuth() {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Unauthorized");
  }
  if (session.error === "RefreshAccessTokenError") {
    throw new Error("Token refresh failed; please sign in again");
  }

  return {
    oauth2: createOAuthClient(session.accessToken),
    session,
  };
}

export function getSheetsClient(authClient: GoogleOAuthClient) {
  return google.sheets({ version: "v4", auth: authClient });
}

export function getDriveClient(authClient: GoogleOAuthClient) {
  return google.drive({ version: "v3", auth: authClient });
}
