import type { GoogleSheetColumnMapping, NormalizedArticleEntry } from "@/lib/core/types";
import { toMonthKey, toWeekKey } from "@/lib/utils/time";

export function extractSpreadsheetId(input: string) {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? trimmed;
}

function findColumnIndex(headers: string[], target?: string) {
  if (!target) {
    return -1;
  }

  return headers.findIndex((header) => header.trim().toLowerCase() === target.trim().toLowerCase());
}

export function mapSheetRowsToArticles(
  rows: string[][],
  mapping: GoogleSheetColumnMapping,
): NormalizedArticleEntry[] {
  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0] ?? [];
  const submittedAtIndex = findColumnIndex(headers, mapping.submitted_at);
  const titleIndex = findColumnIndex(headers, mapping.title);
  const wordCountIndex = findColumnIndex(headers, mapping.word_count);
  const payIndex = findColumnIndex(headers, mapping.pay);
  const statusIndex = findColumnIndex(headers, mapping.status);
  const outletIndex = findColumnIndex(headers, mapping.outlet);

  return rows.slice(1).flatMap((row, index) => {
    const submittedAt = row[submittedAtIndex]?.trim();
    const title = row[titleIndex]?.trim();

    if (!submittedAt || !title) {
      return [];
    }

    return [
      {
        id: `sheet-row-${index + 1}`,
        source: "google-sheets",
        sourceId: `row-${index + 1}`,
        sourceUrl: undefined,
        submittedAt: new Date(submittedAt).toISOString(),
        title,
        wordCount: wordCountIndex >= 0 ? Number(row[wordCountIndex]) || undefined : undefined,
        pay: payIndex >= 0 ? Number(row[payIndex]) || undefined : undefined,
        status: statusIndex >= 0 ? row[statusIndex]?.trim() || undefined : undefined,
        outlet: outletIndex >= 0 ? row[outletIndex]?.trim() || undefined : undefined,
        weekKey: toWeekKey(new Date(submittedAt)),
        monthKey: toMonthKey(new Date(submittedAt)),
      },
    ];
  });
}
