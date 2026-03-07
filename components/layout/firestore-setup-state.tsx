type Props = {
  title: string;
  message: string;
};

export function FirestoreSetupState({ title, message }: Props) {
  return (
    <section className="rounded-[2rem] border border-amber-300 bg-amber-50 p-8 shadow-lg">
      <p className="text-xs uppercase tracking-[0.4em] text-amber-800">Setup required</p>
      <h2 className="mt-3 text-3xl font-semibold text-stone-950">{title}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-700">{message}</p>
      <div className="mt-6 rounded-3xl border border-amber-200 bg-white/70 p-5 text-sm text-stone-700">
        <p className="font-semibold text-stone-950">What to verify</p>
        <ul className="mt-3 space-y-2">
          <li>Firestore API is enabled for the same Firebase project as your service account.</li>
          <li>A Firestore database exists in that project.</li>
          <li>Your service account belongs to the same project in `.env.local`.</li>
          <li>If Firestore was just enabled, wait a couple of minutes and refresh.</li>
        </ul>
      </div>
    </section>
  );
}
