import { describe, expect, it } from "vitest";

import { extractSpreadsheetId, mapSheetRowsToArticles } from "@/lib/integrations/google-sheets/utils";

describe("google sheets utils", () => {
  it("extracts spreadsheet id from full url", () => {
    expect(
      extractSpreadsheetId("https://docs.google.com/spreadsheets/d/abc123XYZ456/edit#gid=0"),
    ).toBe("abc123XYZ456");
  });

  it("maps rows with flexible column names", () => {
    const rows = [
      ["Submitted", "Headline", "Pay"],
      ["2026-03-05", "Submit Plex ARC GPU article", "275"],
    ];

    const articles = mapSheetRowsToArticles(rows, {
      submitted_at: "Submitted",
      title: "Headline",
      pay: "Pay",
    });

    expect(articles).toHaveLength(1);
    expect(articles[0]?.title).toBe("Submit Plex ARC GPU article");
    expect(articles[0]?.pay).toBe(275);
  });
});
