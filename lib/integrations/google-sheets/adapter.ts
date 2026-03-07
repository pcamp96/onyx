import { google } from "googleapis";

import type { GoogleSheetConfig } from "@/lib/core/types";
import type { IntegrationAdapter, SyncContext, IntegrationSyncResult } from "@/lib/integrations/interfaces";
import { extractSpreadsheetId, mapSheetRowsToArticles } from "@/lib/integrations/google-sheets/utils";

function buildAuth(secret?: string | null) {
  if (!secret) {
    return undefined;
  }

  const credentials = JSON.parse(secret) as { client_email: string; private_key: string };
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function assertConfig(config?: GoogleSheetConfig | Record<string, unknown> | null): GoogleSheetConfig {
  if (!config || typeof config !== "object") {
    throw new Error("Google Sheets config is missing");
  }

  return config as unknown as GoogleSheetConfig;
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
    const auth = buildAuth(context.secret);
    const sheets = google.sheets({ version: "v4", auth });
    const range = `${config.worksheetName}!A:Z`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = (response.data.values ?? []) as string[][];
    const articleEntries = mapSheetRowsToArticles(rows, config.columnMapping);

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
  }
}
