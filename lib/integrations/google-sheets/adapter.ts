import { google } from "googleapis";

import { IntegrationRequestError } from "@/lib/integrations/errors";
import { parseGoogleServiceAccount, toGoogleIntegrationError } from "@/lib/integrations/google/utils";
import type { GoogleSheetConfig } from "@/lib/core/types";
import type { IntegrationAdapter, SyncContext, IntegrationSyncResult } from "@/lib/integrations/interfaces";
import { extractSpreadsheetId, mapSheetRowsToArticles, toGoogleSheetConfig } from "@/lib/integrations/google-sheets/utils";

function buildAuth(secret?: string | null) {
  if (!secret) {
    return undefined;
  }

  const credentials = parseGoogleServiceAccount(secret, "Google Sheets service account secret");
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function assertConfig(config?: GoogleSheetConfig | Record<string, unknown> | null): GoogleSheetConfig {
  if (!config || typeof config !== "object") {
    throw new IntegrationRequestError("Google Sheets config is missing");
  }

  return toGoogleSheetConfig(config as GoogleSheetConfig | Record<string, unknown>);
}

export class GoogleSheetsAdapter implements IntegrationAdapter {
  provider = "google-sheets" as const;
  capabilities = ["articles"];

  async testConnection(context: SyncContext) {
    const result = await this.sync(context);
    return {
      ok: true,
      message: `Read ${result.articleEntries.length} article rows`,
      preview: result.articleEntries.slice(0, 5),
    };
  }

  async sync(context: SyncContext): Promise<IntegrationSyncResult> {
    const config = assertConfig(context.config);
    const spreadsheetId = extractSpreadsheetId(config.spreadsheetId || config.sourceUrl || "");
    if (!spreadsheetId) {
      throw new IntegrationRequestError("Google Sheets spreadsheetId is missing");
    }

    if (!config.worksheetName?.trim()) {
      throw new IntegrationRequestError("Google Sheets worksheetName is missing");
    }

    const auth = buildAuth(context.secret);
    try {
      const sheets = google.sheets({ version: "v4", auth });
      const range = `${config.worksheetName}!A:Z`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      const rows = (response.data.values ?? []) as string[][];
      const articleEntries = mapSheetRowsToArticles(rows, config);

      return {
        tasks: [],
        calendarEvents: [],
        articleEntries,
        warnings: [],
        rawPreview: {
          spreadsheetId,
          worksheetName: config.worksheetName,
          rowCount: rows.length,
        },
      };
    } catch (error) {
      throw toGoogleIntegrationError(error, "Google Sheets request failed");
    }
  }
}
