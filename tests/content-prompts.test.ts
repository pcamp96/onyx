import { describe, expect, it } from "vitest";

import type { PlannerSummary, RankedTask } from "@/lib/core/types";
import { generateContentPrompts } from "@/lib/planner/content-prompts";

const summary: PlannerSummary = {
  articlesSubmittedThisWeek: 2,
  weeklyMinimum: 3,
  weeklyGoal: 5,
  remainingToMinimum: 1,
  remainingToGoal: 3,
  estimatedPaySoFar: 900,
};

const rankedTasks: RankedTask[] = [
  {
    id: "onyx-1",
    source: "todoist",
    sourceId: "1",
    area: "ADMIN",
    title: "Refine Onyx daily planning workflow",
    notes: "Improve how the operator ranks and explains priorities",
    status: "open",
    isOverdue: false,
    isBlocked: false,
    projectName: "Onyx",
    score: 95,
    rank: 1,
    reason: "This has the strongest execution value right now.",
    scoreBreakdown: {
      deadlineProximity: 0,
      writingPaceGap: 0,
      incomeImpact: 0,
      businessImpact: 9,
      urgency: 8,
      areaWeight: 4,
      overdueAdjustment: 0,
      calendarCapacityAdjustment: 0,
      sponsorRiskAdjustment: 0,
      blockedAdjustment: 0,
      createdWorkshopAdjustment: 0,
    },
  },
  {
    id: "tlw-1",
    source: "asana",
    sourceId: "2",
    area: "TLW",
    title: "Interview laser shops about quoting friction",
    status: "open",
    isOverdue: false,
    isBlocked: true,
    projectName: "The Laser Workshop",
    score: 84,
    rank: 2,
    reason: "Sponsor risk raises urgency.",
    scoreBreakdown: {
      deadlineProximity: 10,
      writingPaceGap: 0,
      incomeImpact: 6,
      businessImpact: 10,
      urgency: 6,
      areaWeight: 28,
      overdueAdjustment: 0,
      calendarCapacityAdjustment: 0,
      sponsorRiskAdjustment: 16,
      blockedAdjustment: -10,
      createdWorkshopAdjustment: 0,
    },
  },
  {
    id: "unbrella-1",
    source: "todoist",
    sourceId: "3",
    area: "ADMIN",
    title: "Prototype privacy-first forecast onboarding",
    notes: "Unbrella weather onboarding without ads or tracking",
    status: "open",
    isOverdue: false,
    isBlocked: false,
    projectName: "Unbrella",
    score: 72,
    rank: 3,
    reason: "This has the strongest execution value right now.",
    scoreBreakdown: {
      deadlineProximity: 0,
      writingPaceGap: 0,
      incomeImpact: 0,
      businessImpact: 8,
      urgency: 4,
      areaWeight: 4,
      overdueAdjustment: 0,
      calendarCapacityAdjustment: 0,
      sponsorRiskAdjustment: 0,
      blockedAdjustment: 0,
      createdWorkshopAdjustment: 0,
    },
  },
];

describe("content prompts", () => {
  it("generates diversified today prompts tied to real work", () => {
    const prompts = generateContentPrompts({
      command: "today",
      summary,
      rankedTasks,
      warnings: ["Sponsor deliverable is at risk."],
      articleEntries: [],
      primaryFocus: "Onyx planning momentum",
    });

    expect(prompts).toHaveLength(4);
    expect(new Set(prompts.map((prompt) => prompt.category)).size).toBe(prompts.length);
    expect(prompts.some((prompt) => prompt.project === "Onyx")).toBe(true);
    expect(prompts.some((prompt) => prompt.project === "The Laser Workshop")).toBe(true);
    expect(prompts.some((prompt) => prompt.project === "Unbrella")).toBe(true);
    expect(prompts.every((prompt) => !prompt.prompt.includes("How-To Geek"))).toBe(true);
    expect(prompts.every((prompt) => prompt.prompt.length > 40)).toBe(true);
  });

  it("generates weekly prompts with strategic angles", () => {
    const prompts = generateContentPrompts({
      command: "week",
      summary,
      rankedTasks,
      warnings: ["Created Workshop item has a real deadline and moved up."],
      articleEntries: [],
      primaryFocus: "Laser Workshop momentum",
    });

    expect(prompts.length).toBeGreaterThanOrEqual(4);
    expect(prompts.some((prompt) => prompt.category === "Story")).toBe(true);
    expect(prompts.some((prompt) => prompt.category === "Founder reflection")).toBe(true);
    expect(prompts.some((prompt) => prompt.category === "Vision")).toBe(true);
    expect(prompts.every((prompt) => !prompt.prompt.includes("How-To Geek"))).toBe(true);
  });

  it("supports idea-oriented prompt generation for downstream /ideas rendering", () => {
    const prompts = generateContentPrompts({
      command: "ideas",
      summary,
      rankedTasks,
      warnings: [],
      articleEntries: [],
      primaryFocus: "Founder experimentation",
    });

    expect(prompts.length).toBeGreaterThanOrEqual(3);
    expect(prompts.some((prompt) => prompt.category === "Problem/Solution")).toBe(true);
    expect(prompts.some((prompt) => prompt.category === "Curiosity/question")).toBe(true);
    expect(prompts.some((prompt) => prompt.project === "Onyx" || prompt.project === "The Laser Workshop" || prompt.project === "Unbrella")).toBe(true);
    expect(prompts.every((prompt) => !prompt.prompt.includes("How-To Geek"))).toBe(true);
  });
});
