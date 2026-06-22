import { createSign } from "crypto";
import fs from "fs";
import path from "path";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
};

type SheetInfo = {
  properties?: {
    title?: string;
  };
};

type SpreadsheetInfo = {
  sheets?: SheetInfo[];
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function parseServiceAccount() {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() || readServiceAccountJsonFromPath();
  if (!rawJson) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON.");

  const parsed = JSON.parse(rawJson) as Partial<GoogleServiceAccount>;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON must include client_email and private_key.");
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key.replace(/\\n/g, "\n"),
  } satisfies GoogleServiceAccount;
}

function readServiceAccountJsonFromPath() {
  const rawPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH?.trim();
  if (!rawPath) return "";

  const resolvedPath = path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`GOOGLE_SERVICE_ACCOUNT_JSON_PATH does not exist: ${resolvedPath}`);
  }

  return fs.readFileSync(resolvedPath, "utf8");
}

function getSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
  if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID.");
  return spreadsheetId;
}

async function getAccessToken() {
  const serviceAccount = parseServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: SHEETS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = base64Url(signer.sign(serviceAccount.private_key));

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signingInput}.${signature}`,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as { access_token?: string; error_description?: string; error?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? "Unable to authenticate with Google Sheets.");
  }

  return payload.access_token;
}

async function googleSheetsFetch(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}/${getSpreadsheetId()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Google Sheets request failed: ${response.status} ${detail}`);
  }

  return response;
}

function escapeSheetTitle(title: string) {
  return title.replace(/'/g, "''");
}

async function ensureSheet(title: string) {
  const response = await googleSheetsFetch("?fields=sheets.properties.title");
  const spreadsheet = (await response.json()) as SpreadsheetInfo;
  const exists = (spreadsheet.sheets ?? []).some((sheet) => sheet.properties?.title === title);
  if (exists) return;

  await googleSheetsFetch(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title } } }],
    }),
  });
}

export async function replaceSheetValues(title: string, values: Array<Array<string | number | boolean | null>>) {
  await ensureSheet(title);
  const safeTitle = escapeSheetTitle(title);
  const safeValues = values.length > 0 ? values : [["No data"]];

  await googleSheetsFetch(`/values/'${safeTitle}'!A:Z:clear`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  await googleSheetsFetch(`/values/'${safeTitle}'!A1?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({
      majorDimension: "ROWS",
      values: safeValues,
    }),
  });

  return {
    sheet: title,
    rows: Math.max(safeValues.length - 1, 0),
  };
}
