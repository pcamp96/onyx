import type { PlanningSnapshot } from "@/lib/core/types";

type Props = {
  today: PlanningSnapshot | null;
  week: PlanningSnapshot | null;
};

export function DebugPanel({ today, week }: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SnapshotCard title="Latest /today JSON" snapshot={today} />
      <SnapshotCard title="Latest /week JSON" snapshot={week} />
    </div>
  );
}

function SnapshotCard({ title, snapshot }: { title: string; snapshot: PlanningSnapshot | null }) {
  return (
    <section className="rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-lg">
      <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
      <pre className="mt-6 overflow-x-auto rounded-3xl bg-stone-950 p-5 text-xs leading-6 text-stone-100">
        {JSON.stringify(snapshot, null, 2)}
      </pre>
    </section>
  );
}
