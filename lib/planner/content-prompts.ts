import type {
  ContentPrompt,
  ContentPromptCategory,
  ContentPromptCommand,
  NormalizedArticleEntry,
  PlannerSummary,
  RankedTask,
} from "@/lib/core/types";

type ProjectKey = "onyx" | "tlw" | "unbrella" | "general";

type SignalType = "progress" | "blocker" | "win" | "lesson" | "reflection" | "idea" | "metric";

interface PromptSignal {
  type: SignalType;
  projectKey: ProjectKey;
  project: string;
  summary: string;
  detail: string;
  hookDetail: string;
  score: number;
}

interface TemplateContext {
  command: ContentPromptCommand;
  signal: PromptSignal;
  summary: PlannerSummary;
  warnings: string[];
  topTask?: RankedTask;
}

interface PromptTemplate {
  category: ContentPromptCategory;
  commands: ContentPromptCommand[];
  signalTypes: SignalType[];
  buildPrompt: (context: TemplateContext) => string;
  buildHook: (context: TemplateContext) => string;
}

const PROJECTS: Array<{
  key: ProjectKey;
  label: string;
  keywords: string[];
}> = [
  {
    key: "onyx",
    label: "Onyx",
    keywords: ["onyx", "operator", "planner", "planning", "workflow", "priority engine", "priority", "command surface"],
  },
  {
    key: "tlw",
    label: "The Laser Workshop",
    keywords: ["laser workshop", "tlw", "laser", "maker", "makers", "saas", "community"],
  },
  {
    key: "unbrella",
    label: "Unbrella",
    keywords: ["unbrella", "weather", "forecast", "privacy", "tracking", "ads"],
  },
];

const CATEGORY_ORDER: Record<ContentPromptCommand, ContentPromptCategory[]> = {
  today: ["Build in public", "Progress update", "Lesson", "Behind the scenes", "Problem/Solution", "Curiosity/question"],
  week: ["Story", "Founder reflection", "Lesson", "Vision", "Progress update", "Opinion", "Problem/Solution"],
  ideas: ["Problem/Solution", "Curiosity/question", "Build in public", "Vision", "Story"],
  stats: ["Progress update", "Opinion", "Build in public", "Founder reflection", "Lesson"],
};

const PROMPT_LIMITS: Record<ContentPromptCommand, number> = {
  today: 4,
  week: 6,
  ideas: 4,
  stats: 3,
};

const PROJECT_FALLBACK_ROTATION: ProjectKey[] = ["onyx", "tlw", "unbrella"];

const TEMPLATES: PromptTemplate[] = [
  {
    category: "Build in public",
    commands: ["today", "ideas", "stats"],
    signalTypes: ["progress", "idea", "win"],
    buildPrompt: ({ signal }) => `Today I pushed ${signal.summary}. The hard part was ${signal.detail}.`,
    buildHook: ({ signal }) => `Building ${signal.project} is forcing me to make real tradeoffs instead of collecting ideas.`,
  },
  {
    category: "Progress update",
    commands: ["today", "week", "stats"],
    signalTypes: ["progress", "win", "metric"],
    buildPrompt: ({ signal }) => `Progress update on ${signal.project}: ${signal.summary}. The next thing I need to prove is ${signal.detail}.`,
    buildHook: ({ signal }) => `${signal.project} only moves when the work gets concrete enough to measure.`,
  },
  {
    category: "Lesson",
    commands: ["today", "week", "stats"],
    signalTypes: ["lesson", "blocker", "win"],
    buildPrompt: ({ signal }) => `One thing I learned this week while working on ${signal.project}: ${signal.summary}. It changed how I think about ${signal.detail}.`,
    buildHook: ({ signal }) => `Most of the useful lessons in ${signal.project} came from friction, not momentum.`,
  },
  {
    category: "Behind the scenes",
    commands: ["today"],
    signalTypes: ["progress", "blocker"],
    buildPrompt: ({ signal }) => `Behind the scenes on ${signal.project}: ${signal.summary}. The messy part nobody sees is ${signal.detail}.`,
    buildHook: ({ signal }) => `The visible output of ${signal.project} is usually the easy part.`,
  },
  {
    category: "Problem/Solution",
    commands: ["today", "week", "ideas"],
    signalTypes: ["blocker", "idea", "progress"],
    buildPrompt: ({ signal }) => `I keep seeing the same problem in ${signal.project}: ${signal.summary}. My current fix is ${signal.detail}.`,
    buildHook: () => `A lot of product direction gets clearer once the underlying bottleneck is obvious.`,
  },
  {
    category: "Curiosity/question",
    commands: ["today", "ideas"],
    signalTypes: ["idea", "blocker", "reflection"],
    buildPrompt: ({ signal }) => `Question I'm exploring in ${signal.project}: ${signal.summary}? Right now I suspect ${signal.detail}.`,
    buildHook: () => `I learn faster when I publish the open question before I have the polished answer.`,
  },
  {
    category: "Story",
    commands: ["week", "ideas"],
    signalTypes: ["win", "blocker", "progress"],
    buildPrompt: ({ signal }) => `A real story from this week in ${signal.project}: ${signal.summary}. It started with ${signal.detail}.`,
    buildHook: ({ signal }) => `The interesting part of building ${signal.project} is how often the plan changes once the work starts.`,
  },
  {
    category: "Founder reflection",
    commands: ["week", "stats"],
    signalTypes: ["reflection", "lesson", "blocker"],
    buildPrompt: ({ signal }) => `Founder reflection from ${signal.project}: ${signal.summary}. I'm rethinking ${signal.detail}.`,
    buildHook: () => `The longer I build, the more I realize leverage comes from better judgment, not more motion.`,
  },
  {
    category: "Vision",
    commands: ["week", "ideas"],
    signalTypes: ["idea", "reflection", "progress"],
    buildPrompt: ({ signal }) => `The direction I'm pushing ${signal.project} toward is ${signal.summary}. To get there, I need to solve ${signal.detail}.`,
    buildHook: () => `Product vision gets real when it is connected to the constraint I am working through right now.`,
  },
  {
    category: "Opinion",
    commands: ["week", "stats"],
    signalTypes: ["reflection", "metric", "lesson"],
    buildPrompt: ({ signal }) => `Opinion: ${signal.summary}. My take comes from working through ${signal.detail}.`,
    buildHook: () => `A lot of accepted startup advice falls apart once you look at the real operating details.`,
  },
];

function normalizeText(...parts: Array<string | undefined>) {
  return parts
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase();
}

function inferProject(task?: Pick<RankedTask, "area" | "title" | "projectName" | "notes" | "tags">): { key: ProjectKey; label: string } {
  const haystack = normalizeText(task?.projectName, task?.title, task?.notes, task?.tags?.join(" "));

  for (const project of PROJECTS) {
    if (project.keywords.some((keyword) => haystack.includes(keyword))) {
      return { key: project.key, label: project.label };
    }
  }

  if (task?.area === "TLW") {
    return { key: "tlw", label: "The Laser Workshop" };
  }

  return { key: "general", label: "Founder work" };
}

function titleFragment(task: RankedTask) {
  return task.title.replace(/\.+$/, "").trim().toLowerCase();
}

function buildTaskSignals(tasks: RankedTask[]): PromptSignal[] {
  return tasks.flatMap((task, index) => {
    const project = inferProject(task);
    const rankedPrefix = index === 0 ? "the highest-leverage work on my list is" : "I am pushing on";
    const signals: PromptSignal[] = [
      {
        type: "progress",
        projectKey: project.key,
        project: project.label,
        summary: `${rankedPrefix} ${titleFragment(task)}`,
        detail: task.reason.toLowerCase(),
        hookDetail: task.reason,
        score: 100 - index * 8 + task.score,
      },
      {
        type: "lesson",
        projectKey: project.key,
        project: project.label,
        summary: `${titleFragment(task)} is forcing me to simplify decisions earlier`,
        detail: task.reason.toLowerCase(),
        hookDetail: task.reason,
        score: 82 - index * 6 + task.score / 4,
      },
    ];

    if (task.isBlocked) {
      signals.push({
        type: "blocker",
        projectKey: project.key,
        project: project.label,
        summary: `${titleFragment(task)} keeps slowing down because ${task.reason.toLowerCase()}`,
        detail: `what to unblock first instead of doing more scattered work`,
        hookDetail: task.reason,
        score: 88 - index * 5 + task.score / 2,
      });
    }

    if (task.isOverdue || task.dueDate) {
      signals.push({
        type: "reflection",
        projectKey: project.key,
        project: project.label,
        summary: `${titleFragment(task)} made timing and sequencing impossible to ignore`,
        detail: `how I decide what deserves urgency`,
        hookDetail: task.reason,
        score: 70 - index * 5 + task.score / 3,
      });
    }

    if (project.key !== "general") {
      signals.push({
        type: "idea",
        projectKey: project.key,
        project: project.label,
        summary: `how ${task.title.trim()} could become a stronger product loop`,
        detail: `which small experiment would create the clearest signal next`,
        hookDetail: task.reason,
        score: 68 - index * 4 + task.score / 3,
      });
    }

    return signals;
  });
}

function buildWarningSignals(warnings: string[], tasks: RankedTask[]): PromptSignal[] {
  return warnings.map((warning, index) => {
    const matchingTask = tasks.find((task) => task.reason.includes("Sponsor") || task.reason.includes("deadline")) ?? tasks[0];
    const project = inferProject(matchingTask);

    return {
      type: "blocker",
      projectKey: project.key,
      project: project.label,
      summary: warning.charAt(0).toLowerCase() + warning.slice(1),
      detail: matchingTask ? titleFragment(matchingTask) : "what I need to tighten operationally",
      hookDetail: warning,
      score: 92 - index * 4,
    };
  });
}

function buildSummarySignals(summary: PlannerSummary, tasks: RankedTask[]): PromptSignal[] {
  const topTask = tasks[0];
  const topProject = inferProject(topTask);
  const signals: PromptSignal[] = [];

  if (summary.articlesSubmittedThisWeek > 0) {
    signals.push({
      type: "win",
      projectKey: "general",
      project: "Founder work",
      summary: `I shipped ${summary.articlesSubmittedThisWeek} pieces of work this week`,
      detail:
        summary.remainingToGoal > 0
          ? `${summary.remainingToGoal} more still stand between me and the weekly goal`
          : "the next challenge is keeping quality high while compounding output",
      hookDetail: "recent output is creating useful operating data",
      score: 84,
    });
  }

  if (typeof summary.estimatedPaySoFar === "number") {
    signals.push({
      type: "metric",
      projectKey: "general",
      project: "Founder work",
      summary: `tracking output against revenue changes how I prioritize work`,
      detail: `$${summary.estimatedPaySoFar} in estimated pay so far is useful, but the bigger question is what compounds`,
      hookDetail: "metrics are only useful when they change behavior",
      score: 80,
    });
  }

  signals.push({
    type: "reflection",
    projectKey: topProject.key,
    project: topProject.label,
    summary:
      summary.remainingToGoal > 0
        ? `being behind pace is forcing sharper tradeoffs than a clean schedule ever would`
        : `hitting pace creates room to think more strategically about where the next leverage comes from`,
    detail: topTask ? titleFragment(topTask) : "the work that keeps earning priority",
    hookDetail: "weekly pace is a real operating constraint",
    score: 72,
  });

  return signals;
}

function buildArticleSignals(articleEntries: NormalizedArticleEntry[]): PromptSignal[] {
  return articleEntries.slice(0, 3).map((entry, index) => ({
    type: "win",
    projectKey: "general",
    project: "Founder work",
    summary: `shipping "${entry.title}" gave me another data point on what output actually compounds`,
    detail: entry.outlet ? `how work changes once it has to be strong enough for ${entry.outlet}` : "how shipping beats polishing",
    hookDetail: entry.title,
    score: 78 - index * 4,
  }));
}

function buildFallbackSignals(command: ContentPromptCommand): PromptSignal[] {
  const categoryProject = PROJECT_FALLBACK_ROTATION.map((projectKey, index) => {
    const project = PROJECTS.find((entry) => entry.key === projectKey);
    return {
      type: command === "ideas" ? ("idea" as const) : ("reflection" as const),
      projectKey,
      project: project?.label ?? "Founder work",
      summary:
        command === "ideas"
          ? `what the next useful experiment in ${project?.label ?? "this project"} should look like`
          : `what building ${project?.label ?? "this project"} is teaching me about focus`,
      detail:
        command === "ideas"
          ? "the smallest version worth testing in public"
          : "which assumptions deserve to be challenged",
      hookDetail: "fallback founder prompt",
      score: 40 - index * 3,
    };
  });

  categoryProject.push({
    type: "reflection",
    projectKey: "general",
    project: "Founder work",
    summary: "the work that feels small day to day often becomes the clearest signal over time",
    detail: "how I want to build with more honesty and less theater",
    hookDetail: "fallback founder reflection",
    score: 32,
  });

  return categoryProject;
}

function dedupeSignals(signals: PromptSignal[]) {
  const seen = new Set<string>();
  return signals.filter((signal) => {
    const key = `${signal.type}:${signal.project}:${signal.summary}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function generateContentPrompts(input: {
  command: ContentPromptCommand;
  summary: PlannerSummary;
  rankedTasks: RankedTask[];
  warnings: string[];
  articleEntries?: NormalizedArticleEntry[];
  primaryFocus: string;
}): ContentPrompt[] {
  const signals = dedupeSignals([
    ...buildTaskSignals(input.rankedTasks),
    ...buildWarningSignals(input.warnings, input.rankedTasks),
    ...buildSummarySignals(input.summary, input.rankedTasks),
    ...buildArticleSignals(input.articleEntries ?? []),
    ...buildFallbackSignals(input.command),
  ]).sort((left, right) => right.score - left.score);

  const templates = CATEGORY_ORDER[input.command]
    .map((category) => TEMPLATES.find((template) => template.category === category))
    .filter((template): template is PromptTemplate => Boolean(template));

  const usedProjects = new Set<string>();
  const usedCategories = new Set<ContentPromptCategory>();
  const prompts: ContentPrompt[] = [];
  const topTask = input.rankedTasks[0];

  for (const template of templates) {
    const signal = signals.find((candidate) => {
      if (!template.commands.includes(input.command) || !template.signalTypes.includes(candidate.type)) {
        return false;
      }

      if (usedCategories.has(template.category)) {
        return false;
      }

      if (usedProjects.size < 3 && candidate.project !== "Founder work" && usedProjects.has(candidate.project)) {
        return false;
      }

      return true;
    });

    if (!signal) {
      continue;
    }

    prompts.push({
      category: template.category,
      project: signal.project,
      prompt: template.buildPrompt({
        command: input.command,
        signal,
        summary: input.summary,
        warnings: input.warnings,
        topTask,
      }),
      hook: template.buildHook({
        command: input.command,
        signal,
        summary: input.summary,
        warnings: input.warnings,
        topTask,
      }),
    });

    usedCategories.add(template.category);
    if (signal.project !== "Founder work") {
      usedProjects.add(signal.project);
    }

    if (prompts.length >= PROMPT_LIMITS[input.command]) {
      break;
    }
  }

  return prompts;
}
