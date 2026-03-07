import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/components/ui/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-stone-900 bg-stone-950 text-white hover:bg-stone-800 hover:border-stone-800",
  secondary:
    "border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50",
  ghost:
    "border border-transparent bg-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900",
  danger:
    "border border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
};

export function Button({
  children,
  className,
  type = "button",
  variant = "primary",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
