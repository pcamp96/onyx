type Props = {
  title: string;
  description?: string;
  payload: unknown;
};

export function DebugBlock({ title, description, payload }: Props) {
  return (
    <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        {description ? <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p> : null}
      </div>
      <pre className="max-h-[30rem] overflow-auto bg-stone-950 px-4 py-4 text-xs leading-6 text-stone-100">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </section>
  );
}
