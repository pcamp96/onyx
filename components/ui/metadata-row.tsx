type Entry = {
  label: string;
  value: string;
};

type Props = {
  items: Entry[];
};

export function MetadataRow({ items }: Props) {
  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-500">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <dt className="font-medium text-stone-600">{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
