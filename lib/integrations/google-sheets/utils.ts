import type { GoogleSheetConfig, GoogleSheetColumnMapping, NormalizedArticleEntry } from "@/lib/core/types";
import { IntegrationRequestError } from "@/lib/integrations/errors";
import { toMonthKey, toWeekKey } from "@/lib/utils/time";

export function extractSpreadsheetId(input: string) {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? trimmed;
}

function normalizeCell(value: string | undefined) {
  return value?.trim() ?? "";
}

function columnLettersToIndex(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(normalized)) {
    return -1;
  }

  return normalized.split("").reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function isColumnReference(value?: string) {
  return Boolean(value && /^[A-Z]{1,3}$/.test(value.trim()));
}

function findColumnIndex(headers: string[], target?: string) {
  if (!target) {
    return -1;
  }

  if (isColumnReference(target)) {
    return columnLettersToIndex(target);
  }

  return headers.findIndex((header) => normalizeCell(header).toLowerCase() === target.trim().toLowerCase());
}

function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toArticleEntry(
  rowIndex: number,
  submittedAtValue: string,
  title: string,
  sourceUrl?: string,
  wordCount?: string,
  pay?: string,
  status?: string,
  outlet?: string,
): NormalizedArticleEntry[] {
  const submittedAtDate = parseDate(submittedAtValue);
  if (!submittedAtDate) {
    return [];
  }

  return [
    {
      id: `sheet-row-${rowIndex + 1}`,
      source: "google-sheets",
      sourceId: `row-${rowIndex + 1}`,
      sourceUrl: normalizeCell(sourceUrl) || undefined,
      submittedAt: submittedAtDate.toISOString(),
      title: title.trim(),
      wordCount: normalizeCell(wordCount) ? Number(wordCount) || undefined : undefined,
      pay: normalizeCell(pay) ? Number(pay) || undefined : undefined,
      status: normalizeCell(status) || undefined,
      outlet: normalizeCell(outlet) || undefined,
      weekKey: toWeekKey(submittedAtDate),
      monthKey: toMonthKey(submittedAtDate),
    },
  ];
}

function mapTableRows(rows: string[][], config: GoogleSheetConfig): NormalizedArticleEntry[] {
  const headerRowNumber = Math.max(config.headerRow ?? 1, 1);
  const dataStartRowNumber = Math.max(config.dataStartRow ?? headerRowNumber + 1, headerRowNumber + 1);
  const headers = rows[headerRowNumber - 1] ?? [];
  const dataRows = rows.slice(dataStartRowNumber - 1);
  const mapping = config.columnMapping;
  const submittedAtIndex = findColumnIndex(headers, mapping.submitted_at);
  const titleIndex = findColumnIndex(headers, mapping.title);

  if (submittedAtIndex < 0) {
    throw new IntegrationRequestError("Google Sheets could not find the submitted date column");
  }

  if (titleIndex < 0) {
    throw new IntegrationRequestError("Google Sheets could not find the title column");
  }

  const sourceUrlIndex = findColumnIndex(headers, mapping.source_url);
  const wordCountIndex = findColumnIndex(headers, mapping.word_count);
  const payIndex = findColumnIndex(headers, mapping.pay);
  const statusIndex = findColumnIndex(headers, mapping.status);
  const outletIndex = findColumnIndex(headers, mapping.outlet);

  return dataRows.flatMap((row, index) => {
    const submittedAt = normalizeCell(row[submittedAtIndex]);
    const title = normalizeCell(row[titleIndex]);

    if (!submittedAt || !title) {
      return [];
    }

    return toArticleEntry(
      dataStartRowNumber + index - 1,
      submittedAt,
      title,
      sourceUrlIndex >= 0 ? row[sourceUrlIndex] : undefined,
      wordCountIndex >= 0 ? row[wordCountIndex] : undefined,
      payIndex >= 0 ? row[payIndex] : undefined,
      statusIndex >= 0 ? row[statusIndex] : undefined,
      outletIndex >= 0 ? row[outletIndex] : undefined,
    );
  });
}

const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayOffsetFromWeekStart(weekStart: Date, dayLabel: string) {
  const targetDay = DAY_INDEX[dayLabel.trim().toLowerCase()];
  if (targetDay === undefined) {
    return null;
  }

  const startDay = weekStart.getUTCDay();
  return (targetDay - startDay + 7) % 7;
}

function parseWeekStartDate(config: GoogleSheetConfig, fallbackYear: number) {
  if (config.weekStartDate?.trim()) {
    const explicit = parseDate(config.weekStartDate.trim());
    if (explicit) {
      return startOfDay(explicit);
    }
  }

  const match = config.worksheetName.match(/([A-Za-z]+)\s+(\d{1,2})/);
  if (!match) {
    return null;
  }

  const parsed = parseDate(`${match[1]} ${match[2]}, ${fallbackYear}`);
  return parsed ? startOfDay(parsed) : null;
}

function mapWeeklyGridRows(rows: string[][], config: GoogleSheetConfig): NormalizedArticleEntry[] {
  const subheaderRowNumber = Math.max(config.headerRow ?? 2, 2);
  const dayHeaderRowNumber = subheaderRowNumber - 1;
  const dataStartRowNumber = Math.max(config.dataStartRow ?? subheaderRowNumber + 1, subheaderRowNumber + 1);
  const dayHeaders = rows[dayHeaderRowNumber - 1] ?? [];
  const subheaders = rows[subheaderRowNumber - 1] ?? [];
  const weekStart = parseWeekStartDate(config, new Date().getUTCFullYear());

  if (!weekStart) {
    throw new IntegrationRequestError(
      "Google Sheets weekly grid layout needs a weekStartDate or a worksheet name like 'March 2-6'",
    );
  }

  type ColumnGroup = {
    dayLabel: string;
    titleColumn: number;
    sourceUrlColumn?: number;
  };

  const groups: ColumnGroup[] = [];
  let currentDayLabel = "";

  for (let column = 0; column < subheaders.length; column += 1) {
    const maybeDayLabel = normalizeCell(dayHeaders[column]);
    if (maybeDayLabel) {
      currentDayLabel = maybeDayLabel;
    }

    const subheader = normalizeCell(subheaders[column]).toLowerCase();
    if (!currentDayLabel || subheader !== config.columnMapping.title.trim().toLowerCase()) {
      continue;
    }

    let sourceUrlColumn: number | undefined;
    if (config.columnMapping.source_url?.trim()) {
      const target = config.columnMapping.source_url.trim().toLowerCase();
      for (let scan = column + 1; scan < subheaders.length; scan += 1) {
        if (normalizeCell(dayHeaders[scan]) && scan !== column) {
          break;
        }

        if (normalizeCell(subheaders[scan]).toLowerCase() === target) {
          sourceUrlColumn = scan;
          break;
        }
      }
    }

    groups.push({
      dayLabel: currentDayLabel,
      titleColumn: column,
      sourceUrlColumn,
    });
  }

  if (!groups.length) {
    throw new IntegrationRequestError("Google Sheets weekly grid layout could not find any title columns");
  }

  return rows.slice(dataStartRowNumber - 1).flatMap((row, rowOffset) =>
    groups.flatMap((group) => {
      const title = normalizeCell(row[group.titleColumn]);
      if (!title) {
        return [];
      }

      const dayOffset = dayOffsetFromWeekStart(weekStart, group.dayLabel);
      if (dayOffset === null) {
        return [];
      }

      const submittedAt = new Date(weekStart);
      submittedAt.setUTCDate(weekStart.getUTCDate() + dayOffset);

      return toArticleEntry(
        dataStartRowNumber + rowOffset - 1,
        submittedAt.toISOString(),
        title,
        group.sourceUrlColumn !== undefined ? row[group.sourceUrlColumn] : undefined,
      );
    }),
  );
}

export function mapSheetRowsToArticles(rows: string[][], config: GoogleSheetConfig): NormalizedArticleEntry[] {
  if (rows.length < 2) {
    return [];
  }

  if ((config.layout ?? "table") === "weekly_grid") {
    return mapWeeklyGridRows(rows, config);
  }

  return mapTableRows(rows, config);
}

export function toGoogleSheetConfig(
  input: GoogleSheetConfig | (Record<string, unknown> & { columnMapping?: GoogleSheetColumnMapping }),
): GoogleSheetConfig {
  const raw = input as Record<string, unknown>;
  const columnMapping = (raw.columnMapping ?? {}) as GoogleSheetColumnMapping;

  return {
    spreadsheetId: typeof raw.spreadsheetId === "string" ? raw.spreadsheetId : "",
    worksheetName: typeof raw.worksheetName === "string" ? raw.worksheetName : "",
    sourceUrl: typeof raw.sourceUrl === "string" ? raw.sourceUrl : undefined,
    layout: raw.layout === "weekly_grid" ? "weekly_grid" : "table",
    headerRow: typeof raw.headerRow === "number" ? raw.headerRow : undefined,
    dataStartRow: typeof raw.dataStartRow === "number" ? raw.dataStartRow : undefined,
    weekStartDate: typeof raw.weekStartDate === "string" ? raw.weekStartDate : undefined,
    columnMapping: {
      submitted_at: typeof columnMapping.submitted_at === "string" ? columnMapping.submitted_at : "submitted_at",
      title: typeof columnMapping.title === "string" ? columnMapping.title : "title",
      source_url: typeof columnMapping.source_url === "string" ? columnMapping.source_url : undefined,
      word_count: typeof columnMapping.word_count === "string" ? columnMapping.word_count : undefined,
      pay: typeof columnMapping.pay === "string" ? columnMapping.pay : undefined,
      status: typeof columnMapping.status === "string" ? columnMapping.status : undefined,
      outlet: typeof columnMapping.outlet === "string" ? columnMapping.outlet : undefined,
    },
  };
}
