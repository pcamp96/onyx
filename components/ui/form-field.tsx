import type { PropsWithChildren } from "react";

import { cn } from "@/components/ui/utils";

type Props = PropsWithChildren<{
  label: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
}>;

export function FormField({ label, hint, htmlFor, className, children }: Props) {
  return (
    <label className={cn("block space-y-2", className)} htmlFor={htmlFor}>
      <span className="block text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-stone-500">{hint}</span> : null}
    </label>
  );
}
