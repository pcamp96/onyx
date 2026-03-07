import { describe, expect, it } from "vitest";

import { extractSpreadsheetId, mapSheetRowsToArticles, toGoogleSheetConfig } from "@/lib/integrations/google-sheets/utils";

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
      spreadsheetId: "sheet-1",
      worksheetName: "Articles",
      columnMapping: {
        submitted_at: "Submitted",
        title: "Headline",
        pay: "Pay",
      },
    });

    expect(articles).toHaveLength(1);
    expect(articles[0]?.title).toBe("Submit Plex ARC GPU article");
    expect(articles[0]?.pay).toBe(275);
  });

  it("maps weekly grid sheets using day headers", () => {
    const rows = [
      ["Monday", "", "", "Tuesday", "", ""],
      ["Name", "Emaki Link", "Asana Link", "Name", "Emaki Link", "Asana Link"],
      ["Story A", "https://example.com/a", "", "Story B", "https://example.com/b", ""],
    ];

    const articles = mapSheetRowsToArticles(rows, {
      spreadsheetId: "sheet-1",
      worksheetName: "March 2-6",
      layout: "weekly_grid",
      headerRow: 2,
      dataStartRow: 3,
      weekStartDate: "2026-03-02",
      columnMapping: {
        submitted_at: "",
        title: "Name",
        source_url: "Emaki Link",
      },
    });

    expect(articles).toHaveLength(2);
    expect(articles[0]?.title).toBe("Story A");
    expect(articles[0]?.submittedAt.startsWith("2026-03-02")).toBe(true);
    expect(articles[0]?.sourceUrl).toBe("https://example.com/a");
    expect(articles[1]?.submittedAt.startsWith("2026-03-03")).toBe(true);
  });

  it("excludes rows after configured end row", () => {
    const rows = [
      ["Monday", "", ""],
      ["Name", "Emaki Link", "Asana Link"],
      ["Story A", "https://example.com/a", ""],
      ["TOTAL", "", "3"],
    ];

    const articles = mapSheetRowsToArticles(rows, {
      spreadsheetId: "sheet-1",
      worksheetName: "March 2-6",
      layout: "weekly_grid",
      headerRow: 2,
      dataStartRow: 3,
      endRow: 3,
      weekStartDate: "2026-03-02",
      columnMapping: {
        submitted_at: "",
        title: "Name",
        source_url: "Emaki Link",
      },
    });

    expect(articles).toHaveLength(1);
    expect(articles[0]?.title).toBe("Story A");
  });

  it("normalizes multiple worksheet names", () => {
    expect(
      toGoogleSheetConfig({
        spreadsheetId: "sheet-1",
        worksheetNames: ["March 2-6", " March 9-13 ", ""],
        columnMapping: {
          submitted_at: "Submitted",
          title: "Headline",
        },
      }),
    ).toMatchObject({
      worksheetName: "March 2-6",
      worksheetNames: ["March 2-6", "March 9-13"],
    });
  });

  it("splits comma separated worksheet names", () => {
    expect(
      toGoogleSheetConfig({
        spreadsheetId: "sheet-1",
        worksheetName: "March 2-6, March 9-13, March 16-20",
        columnMapping: {
          submitted_at: "Submitted",
          title: "Headline",
        },
      }),
    ).toMatchObject({
      worksheetName: "March 2-6",
      worksheetNames: ["March 2-6", "March 9-13", "March 16-20"],
    });
  });

  it("infers weekly grid layout from multiple worksheets", () => {
    expect(
      toGoogleSheetConfig({
        spreadsheetId: "sheet-1",
        worksheetName: "March 2-6, March 9-13",
        columnMapping: {
          submitted_at: "submitted_at",
          title: "Name",
        },
      }),
    ).toMatchObject({
      layout: "weekly_grid",
    });
  });
});
