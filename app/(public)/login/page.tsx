import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getOptionalFirebaseClientEnv } from "@/lib/config/env";
import { getSessionUser } from "@/lib/firebase/auth";

export default async function LoginPage() {
  const session = await getSessionUser();
  if (session) {
    redirect("/overview");
  }

  const firebaseConfig = getOptionalFirebaseClientEnv();

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.85fr)]">
        <SectionCard className="bg-stone-950 text-stone-50">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">Onyx</p>
              <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">
                Ranked execution lists for a serious founder operating cadence.
              </h1>
            </div>
            <div className="space-y-3 text-sm leading-7 text-stone-300">
              <p>Onyx turns tasks, publishing pace, and calendar constraints into a focused command surface.</p>
              <p>The interface is designed for high-signal operational review, not generic dashboard theater.</p>
            </div>
          </div>
        </SectionCard>
        <SectionCard>
          <PageHeader
            title={firebaseConfig ? "Sign in" : "Firebase setup required"}
            description={
              firebaseConfig
                ? "Use your Firebase email/password admin account. Session cookies protect the founder surfaces."
                : "Add the required Firebase and encryption variables to `.env.local`, then restart the app."
            }
          />
          <div className="mt-6">
            {firebaseConfig ? (
              <LoginForm firebaseConfig={firebaseConfig} />
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-stone-700">
                <p className="font-medium text-stone-900">Required before login works</p>
                <ul className="mt-3 space-y-2 leading-6">
                  <li>`FIREBASE_PROJECT_ID`</li>
                  <li>`FIREBASE_CLIENT_EMAIL`</li>
                  <li>`FIREBASE_PRIVATE_KEY`</li>
                  <li>`FIREBASE_WEB_API_KEY`</li>
                  <li>`FIREBASE_AUTH_DOMAIN`</li>
                  <li>`FIREBASE_APP_ID`</li>
                  <li>`ONYX_ENCRYPTION_KEY`</li>
                </ul>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
