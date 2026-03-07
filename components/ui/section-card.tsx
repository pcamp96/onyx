import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "@/components/ui/utils";

type Props = PropsWithChildren<{
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
}>;

export function SectionCard({
  title,
  description,
  action,
  className,
  contentClassName,
  children,
}: Props) {
  return (
    <section className={cn("rounded-xl border border-stone-200 bg-white", className)}>
      {title || description || action ? (
        <header className="flex flex-col gap-2.5 border-b border-stone-200 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-sm font-semibold text-stone-900">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-5 text-stone-600">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-4 py-3", contentClassName)}>{children}</div>
    </section>
  );
}
