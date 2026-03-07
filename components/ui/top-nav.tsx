"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/components/ui/utils";

type Props = {
  email?: string;
};

const links = [
  { href: "/overview", label: "Overview" },
  { href: "/settings", label: "Settings" },
  { href: "/integrations", label: "Integrations" },
  { href: "/debug", label: "Debug" },
];

export function TopNav({ email }: Props) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-[color:var(--panel)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-2.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/overview" className="text-sm font-semibold tracking-[0.12em] text-stone-950 uppercase">
            Onyx
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-stone-950 text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">Authenticated</p>
            <p className="mt-1 text-sm text-stone-700">{email ?? "Founder"}</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
