import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">Onyx</p>
        <h1 className="mt-1.5 text-[1.75rem] font-semibold tracking-tight text-stone-950">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-5 text-stone-600">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
