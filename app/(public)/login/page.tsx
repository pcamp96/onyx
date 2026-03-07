import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getOptionalFirebaseClientEnv } from "@/lib/config/env";
import { getSessionUser } from "@/lib/firebase/auth";

export default async function LoginPage() {
  const session = await getSessionUser();
  if (session) {
    redirect("/overview");
  }

  const firebaseConfig = getOptionalFirebaseClientEnv();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f0e6d3,_#e2d3bb_45%,_#cdbb9f)] px-6">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2.5rem] border border-stone-900/10 bg-stone-950 p-10 text-stone-50 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.5em] text-stone-400">Onyx</p>
          <h1 className="mt-5 max-w-lg text-5xl font-semibold leading-tight">
            Ranked execution lists, not hour-by-hour planning.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-stone-300">
            Onyx uses tasks, article pace, and calendar constraints to answer what must happen today and what can wait.
          </p>
        </section>
        <section className="rounded-[2.5rem] border border-stone-900/10 bg-white/85 p-10 shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.4em] text-stone-500">Admin access</p>
          {firebaseConfig ? (
            <>
              <h2 className="mt-3 text-3xl font-semibold text-stone-950">Sign in</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Use your Firebase email/password admin account. Session cookies secure all founder routes.
              </p>
              <div className="mt-8">
                <LoginForm firebaseConfig={firebaseConfig} />
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-3xl font-semibold text-stone-950">Firebase setup required</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Add the Firebase and encryption variables from `.env.example` to `.env.local`, then restart `npm run dev`.
              </p>
              <div className="mt-8 rounded-3xl border border-amber-300 bg-amber-50 p-5 text-sm text-stone-700">
                <p className="font-semibold text-stone-900">Required before login works</p>
                <ul className="mt-3 space-y-2">
                  <li>`FIREBASE_PROJECT_ID`</li>
                  <li>`FIREBASE_CLIENT_EMAIL`</li>
                  <li>`FIREBASE_PRIVATE_KEY`</li>
                  <li>`FIREBASE_WEB_API_KEY`</li>
                  <li>`FIREBASE_AUTH_DOMAIN`</li>
                  <li>`FIREBASE_APP_ID`</li>
                  <li>`ONYX_ENCRYPTION_KEY`</li>
                </ul>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
