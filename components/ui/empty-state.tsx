import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-5 py-6">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
