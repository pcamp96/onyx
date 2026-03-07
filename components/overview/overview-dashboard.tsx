import type { PlanningSnapshot } from "@/lib/core/types";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";

type Props = {
  today: PlanningSnapshot | null;
  week: PlanningSnapshot | null;
};

export function OverviewDashboard({ today, week }: Props) {
  const summaryCards = [
    { label: "Submitted this week", value: today?.summary.articlesSubmittedThisWeek ?? 0 },
    { label: "Remaining to minimum", value: today?.summary.remainingToMinimum ?? 0 },
    { label: "Remaining to goal", value: today?.summary.remainingToGoal ?? 0 },
    { label: "Calendar constraints", value: today?.calendarConstraints.length ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="A compact view of current execution pressure, weekly pacing, and the latest ranked output."
      />
      <SectionCard>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">Today</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              {today?.primaryFocus ?? "No plan available yet"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Onyx ranks execution pressure rather than time blocks. Refresh `/today` to update the latest priority ordering.
            </p>
          </div>
          <StatusBadge label={today?.date ?? "No snapshot"} tone={today ? "success" : "warning"} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <SummaryCard key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </SectionCard>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)]">
        <SectionCard
          title="Latest ranked output"
          description="Current task ordering based on urgency, weekly pace, and available execution capacity."
        >
          {today?.rankedTasks?.length ? (
            <div className="space-y-3">
              {today.rankedTasks.map((task) => (
                <article key={task.id} className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
                          {task.area}
                        </span>
                        <span className="text-xs text-stone-400">#{task.rank}</span>
                        {task.isOverdue ? <StatusBadge label="Overdue" tone="error" /> : null}
                        {task.isBlocked ? <StatusBadge label="Blocked" tone="warning" /> : null}
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-stone-950">{task.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-stone-600">{task.reason}</p>
                    </div>
                    <div className="shrink-0 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-950">
                      {task.score}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No ranked tasks yet"
              description="Run the planner so Onyx can surface current priorities and execution risks."
            />
          )}
        </SectionCard>
        <div className="space-y-6">
          <SectionCard title="Warnings" description="Signals that need attention before the next planning cycle.">
            <ul className="space-y-3 text-sm text-stone-700">
              {(today?.warnings.length ? today.warnings : ["No active warnings."]).map((warning) => (
                <li key={warning} className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3">
                  {warning}
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Week summary" description="How this week is pacing against publishing targets.">
            <div className="space-y-4">
              <p className="text-sm text-stone-600">
                {week ? `${week.summary.articlesSubmittedThisWeek} articles submitted this week.` : "No weekly snapshot yet."}
              </p>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <SummaryCard label="Remaining to minimum" value={week?.summary.remainingToMinimum ?? 0} compact />
                <SummaryCard label="Remaining to goal" value={week?.summary.remainingToGoal ?? 0} compact />
                <SummaryCard label="Weekly priorities" value={week?.rankedTasks.length ?? 0} compact />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, compact = false }: { label: string; value: number; compact?: boolean }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">{label}</p>
      <p className={compact ? "mt-2 text-xl font-semibold text-stone-950" : "mt-2 text-2xl font-semibold text-stone-950"}>
        {value}
      </p>
    </div>
  );
}
