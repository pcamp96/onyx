import type { IntegrationProvider, NormalizedArticleEntry, NormalizedCalendarEvent, NormalizedTask } from "@/lib/core/types";

export interface SyncContext {
  userId: string;
  config?: Record<string, unknown> | null;
  secret?: string | null;
  now: Date;
}

export interface IntegrationSyncResult {
  tasks: NormalizedTask[];
  calendarEvents: NormalizedCalendarEvent[];
  articleEntries: NormalizedArticleEntry[];
  warnings: string[];
  rawPreview: Record<string, unknown>;
}

export interface IntegrationAdapter {
  provider: IntegrationProvider;
  capabilities: string[];
  testConnection(context: SyncContext): Promise<{ ok: boolean; message: string; preview?: unknown }>;
  sync(context: SyncContext): Promise<IntegrationSyncResult>;
}
