import type { InputHTMLAttributes } from "react";

import { cn } from "@/components/ui/utils";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-900 shadow-none outline-none transition",
        "placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200",
        "disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500",
        className,
      )}
      {...props}
    />
  );
}
