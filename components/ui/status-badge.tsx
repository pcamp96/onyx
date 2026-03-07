import { cn } from "@/components/ui/utils";

type Tone = "neutral" | "success" | "warning" | "error";

type Props = {
  label: string;
  tone?: Tone;
};

const tones: Record<Tone, string> = {
  neutral: "border-stone-200 bg-stone-100 text-stone-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-red-200 bg-red-50 text-red-700",
};

export function StatusBadge({ label, tone = "neutral" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md border px-2.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {label}
    </span>
  );
}
