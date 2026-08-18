/**
 * Google Apps Script HTTP Client
 * 
 * This module handles communication with the Google Apps Script Web App
 * for syncing data to Google Sheets.
 * 
 * Replaces the REST API approach with direct HTTP calls to Apps Script.
 */

type AppsScriptTarget = "orders" | "transactions" | "all";

type AppsScriptPayload = {
  token: string;
  target: AppsScriptTarget;
  data?: Array<Array<string | number | boolean | null>>;
  ordersData?: Array<Array<string | number | boolean | null>>;
  transactionsData?: Array<Array<string | number | boolean | null>>;
};

type AppsScriptResponse = {
  success?: boolean;
  target?: string;
  result?: {
    sheet: string;
    rows: number;
    columns: number;
  } | {
    orders: { sheet: string; rows: number; columns: number };
    transactions: { sheet: string; rows: number; columns: number };
  };
  timestamp?: string;
  error?: string;
  message?: string;
};

/**
 * Get Apps Script configuration from environment variables
 */
function getAppsScriptConfig() {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET?.trim();

  if (!url) {
    throw new Error(
      "Missing GOOGLE_APPS_SCRIPT_URL environment variable. " +
      "Please set up Google Apps Script deployment. " +
      "See docs/GOOGLE_APPS_SCRIPT_SETUP.md for instructions."
    );
  }

  if (!secret) {
    throw new Error(
      "Missing GOOGLE_APPS_SCRIPT_SECRET environment variable. " +
      "Please generate a strong secret token and add it to your environment variables. " +
      "See docs/GOOGLE_APPS_SCRIPT_SETUP.md for instructions."
    );
  }

  return { url, secret };
}

/**
 * Push data to Google Sheets via Apps Script Web App
 * 
 * @param target - Which sheet(s) to sync: "orders", "transactions", or "all"
 * @param data - Data to sync (for single target)
 * @param ordersData - Orders data (for "all" target)
 * @param transactionsData - Transactions data (for "all" target)
 * @returns Result with sheet info and row counts
 */
export async function pushToGoogleSheets(
  target: AppsScriptTarget,
  data?: Array<Array<string | number | boolean | null>>,
  ordersData?: Array<Array<string | number | boolean | null>>,
  transactionsData?: Array<Array<string | number | boolean | null>>
): Promise<{
  success: boolean;
  target: string;
  result?: AppsScriptResponse["result"];
}> {
  const config = getAppsScriptConfig();

  // Validate payload based on target
  if (target === "all") {
    if (!ordersData || !transactionsData) {
      throw new Error('Target "all" requires both ordersData and transactionsData');
    }
  } else {
    if (!data) {
      throw new Error(`Target "${target}" requires data parameter`);
    }
  }

  // Build payload
  const payload: AppsScriptPayload = {
    token: config.secret,
    target,
  };

  if (target === "all") {
    payload.ordersData = ordersData;
    payload.transactionsData = transactionsData;
  } else {
    payload.data = data;
  }

  // Make HTTP request to Apps Script
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Parse response
    const responseData = await response.json().catch(() => ({
      error: "Invalid JSON response from Apps Script",
    })) as AppsScriptResponse;

    // Check for errors
    if (!response.ok) {
      const errorMessage = responseData.error || responseData.message || `HTTP ${response.status}`;
      throw new Error(`Apps Script error: ${errorMessage}`);
    }

    if (!responseData.success) {
      throw new Error(
        responseData.error || 
        responseData.message || 
        "Apps Script returned success: false"
      );
    }

    // Return success result
    return {
      success: true,
      target: responseData.target || target,
      result: responseData.result,
    };

  } catch (error) {
    // Enhanced error handling
    if (error instanceof Error) {
      // Check for common error patterns
      if (error.message.includes("Unauthorized")) {
        throw new Error(
          "Apps Script authentication failed. " +
          "Please verify GOOGLE_APPS_SCRIPT_SECRET matches the SECRET_TOKEN in your Apps Script. " +
          "See docs/GOOGLE_APPS_SCRIPT_SETUP.md"
        );
      }

      if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
        throw new Error(
          "Cannot connect to Apps Script endpoint. " +
          "Please verify GOOGLE_APPS_SCRIPT_URL is correct and the Web App is deployed. " +
          "See docs/GOOGLE_APPS_SCRIPT_SETUP.md"
        );
      }

      if (error.message.includes("Too many rows")) {
        throw new Error(
          "Dataset too large for Apps Script. " +
          "Apps Script has a 6-minute execution limit. " +
          "Consider implementing batching or reducing the data size."
        );
      }

      // Re-throw with context
      throw new Error(`Google Sheets sync via Apps Script failed: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Test connection to Apps Script endpoint
 * 
 * Makes a simple GET request to verify the endpoint is reachable
 * @returns True if connection is successful
 */
export async function testAppsScriptConnection(): Promise<boolean> {
  const config = getAppsScriptConfig();

  try {
    const response = await fetch(config.url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json().catch(() => ({})) as { status?: string };
    return data.status === "ok";
  } catch (error) {
    throw new Error(
      `Apps Script connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get Apps Script configuration status (for debugging)
 * 
 * @returns Object with configuration status (without exposing secrets)
 */
export function getAppsScriptStatus() {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET?.trim();

  return {
    configured: !!(url && secret),
    hasUrl: !!url,
    hasSecret: !!secret,
    urlPreview: url ? `${url.substring(0, 50)}...` : null,
  };
}
