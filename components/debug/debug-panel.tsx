import type { PlanningDebugRecord, PlanningSnapshot } from "@/lib/core/types";

type Props = {
  todaySnapshot: PlanningSnapshot | null;
  weekSnapshot: PlanningSnapshot | null;
  todayDebug: PlanningDebugRecord | null;
  weekDebug: PlanningDebugRecord | null;
};

export function DebugPanel({ todaySnapshot, weekSnapshot, todayDebug, weekDebug }: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SnapshotCard title="Latest /today snapshot" payload={todaySnapshot} />
      <SnapshotCard title="Latest /week snapshot" payload={weekSnapshot} />
      <SnapshotCard title="Latest /today debug trace" payload={todayDebug} />
      <SnapshotCard title="Latest /week debug trace" payload={weekDebug} />
    </div>
  );
}

function SnapshotCard({ title, payload }: { title: string; payload: PlanningSnapshot | PlanningDebugRecord | null }) {
  return (
    <section className="rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-lg">
      <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
      <pre className="mt-6 overflow-x-auto rounded-3xl bg-stone-950 p-5 text-xs leading-6 text-stone-100">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </section>
  );
}
