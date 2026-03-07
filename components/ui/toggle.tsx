type Props = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

export function Toggle({ checked, disabled, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full border border-transparent bg-stone-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] data-[checked=true]:bg-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
      data-checked={checked}
    >
      <span
        className="block h-4 w-4 translate-x-1 rounded-full bg-white transition data-[checked=true]:translate-x-6"
        data-checked={checked}
      />
    </button>
  );
}
