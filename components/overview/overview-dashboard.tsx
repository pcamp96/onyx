import type { PlanningSnapshot } from "@/lib/core/types";

type Props = {
  today: PlanningSnapshot | null;
  week: PlanningSnapshot | null;
};

export function OverviewDashboard({ today, week }: Props) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-lg backdrop-blur">
        <p className="text-xs uppercase tracking-[0.4em] text-stone-500">Today</p>
        <h2 className="mt-3 text-4xl font-semibold text-stone-950">{today?.primaryFocus ?? "No plan yet"}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
          Onyx ranks execution, not time blocks. Pull `/today` to refresh the latest priority order.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <SummaryCard label="Submitted this week" value={today?.summary.articlesSubmittedThisWeek ?? 0} />
          <SummaryCard label="Remaining to minimum" value={today?.summary.remainingToMinimum ?? 0} />
          <SummaryCard label="Remaining to goal" value={today?.summary.remainingToGoal ?? 0} />
          <SummaryCard label="Calendar constraints" value={today?.calendarConstraints.length ?? 0} />
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-[2rem] border border-stone-900/10 bg-white/75 p-8 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-stone-950">Latest ranked output</h3>
            <span className="text-sm text-stone-500">{today?.date ?? "No snapshot"}</span>
          </div>
          <div className="mt-6 space-y-4">
            {today?.rankedTasks.map((task) => (
              <div key={task.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-stone-500">{task.area}</p>
                    <h4 className="mt-2 text-lg font-semibold text-stone-950">{task.title}</h4>
                    <p className="mt-2 text-sm text-stone-600">{task.reason}</p>
                  </div>
                  <div className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-stone-50">
                    {task.score}
                  </div>
                </div>
              </div>
            )) ?? <p className="text-sm text-stone-500">No ranked tasks yet.</p>}
          </div>
        </div>
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-lg backdrop-blur">
            <h3 className="text-xl font-semibold text-stone-950">Top warnings</h3>
            <ul className="mt-4 space-y-3 text-sm text-stone-700">
              {(today?.warnings.length ? today.warnings : ["No active warnings."]).map((warning) => (
                <li key={warning} className="rounded-2xl bg-stone-100 px-4 py-3">
                  {warning}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[2rem] border border-stone-900/10 bg-stone-950 p-8 text-stone-50 shadow-lg">
            <h3 className="text-xl font-semibold">Week summary</h3>
            <p className="mt-3 text-sm text-stone-300">
              {week ? `${week.summary.articlesSubmittedThisWeek} submitted this week.` : "No weekly snapshot yet."}
            </p>
            <div className="mt-6 space-y-2 text-sm text-stone-300">
              <p>Remaining to minimum: {week?.summary.remainingToMinimum ?? 0}</p>
              <p>Remaining to goal: {week?.summary.remainingToGoal ?? 0}</p>
              <p>Weekly priorities: {week?.rankedTasks.length ?? 0}</p>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-stone-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}
