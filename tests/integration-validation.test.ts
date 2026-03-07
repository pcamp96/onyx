import { describe, expect, it } from "vitest";

import { IntegrationRequestError } from "@/lib/integrations/errors";
import { CalendarAdapter } from "@/lib/integrations/calendar/adapter";
import { GoogleSheetsAdapter } from "@/lib/integrations/google-sheets/adapter";

const now = new Date("2026-03-06T12:00:00.000Z");

describe("integration validation", () => {
  it("requires spreadsheet and worksheet config for Google Sheets", async () => {
    const adapter = new GoogleSheetsAdapter();

    await expect(
      adapter.sync({
        userId: "user-1",
        secret: null,
        config: { worksheetName: "" },
        now,
      }),
    ).rejects.toEqual(expect.objectContaining<Partial<IntegrationRequestError>>({
      message: "Google Sheets spreadsheetId is missing",
      status: 400,
    }));
  });

  it("accepts multiple worksheet names for Google Sheets config", async () => {
    const adapter = new GoogleSheetsAdapter();

    await expect(
      adapter.sync({
        userId: "user-1",
        secret: null,
        config: { spreadsheetId: "sheet-1", worksheetNames: ["March 2-6"] },
        now,
      }),
    ).rejects.not.toEqual(expect.objectContaining<Partial<IntegrationRequestError>>({
      message: "Google Sheets worksheet name is missing",
      status: 400,
    }));
  });

  it("rejects invalid Calendar feed URLs", async () => {
    const adapter = new CalendarAdapter();

    await expect(
      adapter.sync({
        userId: "user-1",
        secret: null,
        config: { icsUrl: "not-a-url" },
        now,
      }),
    ).rejects.toEqual(expect.objectContaining<Partial<IntegrationRequestError>>({
      message: "Calendar ICS URLs must be valid URLs",
      status: 400,
    }));
  });
});
