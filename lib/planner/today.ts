import type {
  PlannerSettings,
  PlannerTodayResult,
  RankedTask,
} from "@/lib/core/types";
import { generateContentPrompts } from "@/lib/planner/content-prompts";
import { derivePrimaryFocus, deriveWarnings } from "@/lib/planner/rules";
import { scoreTask } from "@/lib/planner/scoring";
import { summarizeArticles } from "@/lib/planner/normalizers";
import type { PlannerAggregateInput } from "@/lib/planner/types";
import { toIsoDate } from "@/lib/utils/time";

const DAILY_AREAS: Array<RankedTask["area"]> = ["HTG", "TLW", "CREATED_WORKSHOP"];

function getMaxHtgTasks(weeklyPaceGap: number) {
  return Math.max(1, Math.min(3, weeklyPaceGap + 1));
}

function selectTodayTasks(tasks: RankedTask[], maxTodayTasks: number, weeklyPaceGap: number) {
  if (tasks.length <= maxTodayTasks) {
    return tasks;
  }

  const selectedIds = new Set<string>();
  const selected: RankedTask[] = [];
  const maxHtgTasks = getMaxHtgTasks(weeklyPaceGap);

  const first = tasks[0];
  if (first) {
    selected.push(first);
    selectedIds.add(first.id);
  }

  for (const area of DAILY_AREAS) {
    if (selected.length >= maxTodayTasks || selected.some((task) => task.area === area)) {
      continue;
    }

    const candidate = tasks.find((task) => task.area === area && !selectedIds.has(task.id));
    if (!candidate) {
      continue;
    }

    selected.push(candidate);
    selectedIds.add(candidate.id);
  }

  for (const task of tasks) {
    if (selected.length >= maxTodayTasks) {
      break;
    }
    if (selectedIds.has(task.id)) {
      continue;
    }
    if (task.area === "HTG" && selected.filter((entry) => entry.area === "HTG").length >= maxHtgTasks) {
      continue;
    }

    selected.push(task);
    selectedIds.add(task.id);
  }

  for (const task of tasks) {
    if (selected.length >= maxTodayTasks) {
      break;
    }
    if (selectedIds.has(task.id)) {
      continue;
    }

    selected.push(task);
    selectedIds.add(task.id);
  }

  return selected.sort((left, right) => right.score - left.score);
}

export function buildTodayPlan(input: PlannerAggregateInput, settings: PlannerSettings, now: Date): PlannerTodayResult {
  const summary = summarizeArticles(input.articleEntries, settings, now);
  const weeklyPaceGap = summary.remainingToMinimum;
  const rankedTasks = selectTodayTasks(
    input.tasks
      .map((task) => scoreTask({
        task,
        settings,
        weeklyPaceGap,
        calendarConstraints: input.calendarEvents,
      }))
      .sort((left, right) => right.score - left.score),
    settings.maxTodayTasks,
    weeklyPaceGap,
  )
    .map((task, index): RankedTask => ({
      ...task,
      rank: index + 1,
    }));
  const warnings = [...new Set([...input.warnings, ...deriveWarnings(rankedTasks, settings)])];
  const primaryFocus = derivePrimaryFocus(rankedTasks);

  return {
    date: toIsoDate(now),
    summary,
    calendarConstraints: input.calendarEvents,
    primaryFocus,
    rankedTasks,
    warnings,
    contentPrompts: generateContentPrompts({
      command: "today",
      summary,
      rankedTasks,
      warnings,
      articleEntries: input.articleEntries,
      primaryFocus,
    }),
    generatedAt: now.toISOString(),
  };
}
