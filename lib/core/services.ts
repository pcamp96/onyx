import { FOUNDER_USER_ID } from "@/lib/config/constants";
import type {
  IntegrationProvider,
  NormalizedArticleEntry,
  NormalizedCalendarEvent,
  NormalizedTask,
  PlannerTodayResult,
  PlannerWeekResult,
} from "@/lib/core/types";
import { integrationsRepository, googleSheetConfigRepository } from "@/lib/firebase/repositories/integrations";
import { plannerSettingsRepository } from "@/lib/firebase/repositories/planner-settings";
import { planningSnapshotsRepository } from "@/lib/firebase/repositories/planning-snapshots";
import { secretsRepository } from "@/lib/firebase/repositories/secrets";
import { sponsorProjectsRepository } from "@/lib/firebase/repositories/sponsor-projects";
import { getIntegrationAdapter } from "@/lib/integrations/registry";
import { buildTodayPlan } from "@/lib/planner/today";
import { buildWeekPlan } from "@/lib/planner/week";
import { decryptIntegrationSecret } from "@/lib/security/secrets";

export interface PlannerAggregateInput {
  tasks: NormalizedTask[];
  calendarEvents: NormalizedCalendarEvent[];
  articleEntries: NormalizedArticleEntry[];
  warnings: string[];
  rawPreview: Record<string, unknown>;
}

async function getProviderConfig(provider: IntegrationProvider) {
  if (provider === "google-sheets") {
    return (await googleSheetConfigRepository.get(FOUNDER_USER_ID)) as Record<string, unknown> | null;
  }

  const integration = await integrationsRepository.get(provider);
  return integration as unknown as Record<string, unknown>;
}

async function getProviderSecret(provider: IntegrationProvider) {
  const secret = await secretsRepository.get(provider);
  if (!secret) {
    return null;
  }

  return decryptIntegrationSecret(provider, secret, FOUNDER_USER_ID);
}

export async function syncEnabledIntegrations(now = new Date()): Promise<PlannerAggregateInput> {
  const integrations = await integrationsRepository.list();
  const sponsors = await sponsorProjectsRepository.list();
  const results = await Promise.all(
    integrations
      .filter((integration) => integration.enabled)
      .map(async (integration) => {
        const adapter = await getIntegrationAdapter(integration.provider);
        const [config, secret] = await Promise.all([
          getProviderConfig(integration.provider),
          getProviderSecret(integration.provider),
        ]);
        const result = await adapter.sync({
          userId: FOUNDER_USER_ID,
          config,
          secret,
          now,
        });

        return {
          provider: integration.provider,
          ...result,
        };
      }),
  );

  const tasks = results.flatMap((result) => result.tasks).map((task) => ({
    ...task,
    sponsorRisk:
      task.sponsorRisk ??
      sponsors.some((sponsor) => sponsor.status !== "done" && sponsor.riskLevel === "high"),
  }));

  return {
    tasks,
    calendarEvents: results.flatMap((result) => result.calendarEvents),
    articleEntries: results.flatMap((result) => result.articleEntries),
    warnings: results.flatMap((result) => result.warnings),
    rawPreview: Object.fromEntries(
      results.map((result) => [result.provider, result.rawPreview]),
    ),
  };
}

export async function getTodayPlan(now = new Date()): Promise<PlannerTodayResult> {
  const [settings, aggregate] = await Promise.all([
    plannerSettingsRepository.get(FOUNDER_USER_ID),
    syncEnabledIntegrations(now),
  ]);
  const result = buildTodayPlan(aggregate, settings, now);

  await planningSnapshotsRepository.save({
    type: "today",
    date: result.date,
    userId: FOUNDER_USER_ID,
    summary: result.summary,
    calendarConstraints: result.calendarConstraints,
    rankedTasks: result.rankedTasks,
    warnings: result.warnings,
    rawStats: aggregate.rawPreview,
  });

  return result;
}

export async function getWeekPlan(now = new Date()): Promise<PlannerWeekResult> {
  const [settings, aggregate] = await Promise.all([
    plannerSettingsRepository.get(FOUNDER_USER_ID),
    syncEnabledIntegrations(now),
  ]);
  const result = buildWeekPlan(aggregate, settings, now);

  await planningSnapshotsRepository.save({
    type: "week",
    date: result.weekStart,
    userId: FOUNDER_USER_ID,
    summary: result.summary,
    calendarConstraints: aggregate.calendarEvents,
    rankedTasks: result.rankedPriorities,
    warnings: result.deadlineRisks,
    rawStats: aggregate.rawPreview,
  });

  return result;
}
