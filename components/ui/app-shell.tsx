import type { ReactNode } from "react";

import { TopNav } from "@/components/ui/top-nav";

type Props = {
  email?: string;
  children: ReactNode;
};

export function AppShell({ email, children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <TopNav email={email} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}
