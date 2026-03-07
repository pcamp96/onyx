import { FOUNDER_USER_ID } from "@/lib/core/constants";
import type {
  IntegrationProvider,
  PlannerTodayResult,
  PlannerWeekResult,
  PlanningSnapshot,
} from "@/lib/core/types";
import { integrationConfigsRepository, integrationsRepository } from "@/lib/firebase/repositories/integrations";
import { plannerSettingsRepository } from "@/lib/firebase/repositories/planner-settings";
import {
  planningDebugRepository,
  planningSnapshotsRepository,
} from "@/lib/firebase/repositories/planning-snapshots";
import { secretsRepository } from "@/lib/firebase/repositories/secrets";
import { sponsorProjectsRepository } from "@/lib/firebase/repositories/sponsor-projects";
import { getIntegrationAdapter } from "@/lib/integrations/registry";
import { buildTodayPlan } from "@/lib/planner/today";
import { buildWeekPlan } from "@/lib/planner/week";
import { getBlockingCalendarEvents } from "@/lib/planner/calendar";
import type { PlannerAggregateInput } from "@/lib/planner/types";
import { decryptIntegrationSecret } from "@/lib/security/secrets";

async function getProviderConfig(userId: string, provider: IntegrationProvider) {
  const config = await integrationConfigsRepository.get(userId, provider);
  return config?.values ?? null;
}

async function getProviderSecret(userId: string, provider: IntegrationProvider) {
  const secret = await secretsRepository.get(userId, provider);
  if (!secret) {
    return null;
  }

  return decryptIntegrationSecret(provider, secret, userId);
}

function compactRankedTasks(tasks: PlannerTodayResult["rankedTasks"] | PlannerWeekResult["rankedPriorities"]): PlanningSnapshot["rankedTasks"] {
  return tasks.map((task) => ({
    id: task.id,
    source: task.source,
    sourceId: task.sourceId,
    sourceUrl: task.sourceUrl,
    area: task.area,
    title: task.title,
    status: task.status,
    dueDate: task.dueDate,
    isOverdue: task.isOverdue,
    isBlocked: task.isBlocked,
    score: task.score,
    rank: task.rank,
    reason: task.reason,
    scoreBreakdown: task.scoreBreakdown,
  }));
}

function compactCalendarConstraints(events: PlannerTodayResult["calendarConstraints"]): PlanningSnapshot["calendarConstraints"] {
  return events.map((event) => ({
    id: event.id,
    source: event.source,
    sourceId: event.sourceId,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    isBusy: event.isBusy,
  }));
}

export async function syncEnabledIntegrations(now = new Date(), userId = FOUNDER_USER_ID): Promise<PlannerAggregateInput> {
  const integrations = await integrationsRepository.list(userId);
  const sponsors = await sponsorProjectsRepository.list();
  const results = await Promise.all(
    integrations
      .filter((integration) => integration.enabled)
      .map(async (integration) => {
        const adapter = await getIntegrationAdapter(integration.provider);
        const [config, secret] = await Promise.all([
          getProviderConfig(userId, integration.provider),
          getProviderSecret(userId, integration.provider),
        ]);
        const result = await adapter.sync({
          userId,
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
  const calendarEvents = results.flatMap((result) => result.calendarEvents);
  const articleEntries = results.flatMap((result) => result.articleEntries);

  return {
    tasks,
    calendarEvents,
    articleEntries,
    warnings: results.flatMap((result) => result.warnings),
    debugRecord: {
      date: now.toISOString().slice(0, 10),
      generatedAt: now.toISOString(),
      providerSummaries: Object.fromEntries(
        results.map((result) => [
          result.provider,
          {
            taskCount: result.tasks.length,
            calendarEventCount: result.calendarEvents.length,
            articleEntryCount: result.articleEntries.length,
            preview: result.rawPreview,
          },
        ]),
      ),
      normalizedInputPreview: {
        tasks: tasks.slice(0, 25).map((task) => ({
          id: task.id,
          source: task.source,
          sourceId: task.sourceId,
          title: task.title,
          area: task.area,
          status: task.status,
          dueDate: task.dueDate,
          isOverdue: task.isOverdue,
          isBlocked: task.isBlocked,
        })),
        calendarEvents: calendarEvents.slice(0, 25).map((event) => ({
          id: event.id,
          source: event.source,
          sourceId: event.sourceId,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          isBusy: event.isBusy,
        })),
        articleEntries: articleEntries.slice(0, 25).map((entry) => ({
          id: entry.id,
          source: entry.source,
          sourceId: entry.sourceId,
          title: entry.title,
          submittedAt: entry.submittedAt,
          weekKey: entry.weekKey,
          monthKey: entry.monthKey,
        })),
      },
    },
  };
}

export async function getTodayPlan(now = new Date(), userId = FOUNDER_USER_ID): Promise<PlannerTodayResult> {
  const [settings, aggregate] = await Promise.all([
    plannerSettingsRepository.get(userId),
    syncEnabledIntegrations(now, userId),
  ]);
  const calendarEvents = getBlockingCalendarEvents(aggregate.calendarEvents, settings);
  const result = buildTodayPlan({ ...aggregate, calendarEvents }, settings, now);

  await Promise.all([
    planningSnapshotsRepository.save(userId, {
      type: "today",
      date: result.date,
      summary: result.summary,
      primaryFocus: result.primaryFocus,
      calendarConstraints: compactCalendarConstraints(result.calendarConstraints),
      rankedTasks: compactRankedTasks(result.rankedTasks),
      warnings: result.warnings,
      generatedAt: result.generatedAt,
    }),
    planningDebugRepository.save(userId, "today", aggregate.debugRecord),
  ]);

  return result;
}

export async function getWeekPlan(now = new Date(), userId = FOUNDER_USER_ID): Promise<PlannerWeekResult> {
  const [settings, aggregate] = await Promise.all([
    plannerSettingsRepository.get(userId),
    syncEnabledIntegrations(now, userId),
  ]);
  const calendarEvents = getBlockingCalendarEvents(aggregate.calendarEvents, settings);
  const result = buildWeekPlan({ ...aggregate, calendarEvents }, settings, now);

  await Promise.all([
    planningSnapshotsRepository.save(userId, {
      type: "week",
      date: result.weekStart,
      summary: result.summary,
      primaryFocus: result.primaryFocus,
      calendarConstraints: compactCalendarConstraints(calendarEvents),
      rankedTasks: compactRankedTasks(result.rankedPriorities),
      warnings: result.warnings,
      generatedAt: result.generatedAt,
    }),
    planningDebugRepository.save(userId, "week", aggregate.debugRecord),
  ]);

  return result;
}

export async function getLatestPlannerArtifacts(userId = FOUNDER_USER_ID) {
  const [todaySnapshot, weekSnapshot, todayDebug, weekDebug] = await Promise.all([
    planningSnapshotsRepository.getLatest(userId, "today"),
    planningSnapshotsRepository.getLatest(userId, "week"),
    planningDebugRepository.get(userId, "today"),
    planningDebugRepository.get(userId, "week"),
  ]);

  return { todaySnapshot, weekSnapshot, todayDebug, weekDebug };
}
