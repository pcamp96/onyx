import Link from "next/link";

export default function AppleCalendarIntegrationPage() {
  return (
    <div className="rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-lg">
      <h2 className="text-3xl font-semibold text-stone-950">Apple Calendar config</h2>
      <p className="mt-3 text-sm text-stone-600">
        Configure the ICS feed from the main integrations screen. This route exists so provider-specific screens can expand later.
      </p>
      <Link href="/integrations" className="mt-6 inline-block rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50">
        Back to integrations
      </Link>
    </div>
  );
}
