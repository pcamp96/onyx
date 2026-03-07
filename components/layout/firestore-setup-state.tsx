import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";

type Props = {
  title: string;
  message: string;
};

export function FirestoreSetupState({ title, message }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Setup required"
        description="Onyx can render the admin surface, but Firestore is not ready for the requested data."
      />
      <SectionCard>
        <EmptyState title={title} description={message} />
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-stone-700">
          <p className="font-medium text-stone-950">What to verify</p>
          <ul className="mt-3 space-y-2 leading-6">
            <li>Firestore API is enabled for the same Firebase project as your service account.</li>
            <li>A Firestore database exists in that project.</li>
            <li>Your service account belongs to the same project in `.env.local`.</li>
            <li>If Firestore was just enabled, wait a couple of minutes and refresh.</li>
          </ul>
        </div>
      </SectionCard>
    </div>
  );
}
