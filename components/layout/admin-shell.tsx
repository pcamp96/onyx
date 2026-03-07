import Link from "next/link";

type Props = {
  email?: string;
  children: React.ReactNode;
};

const links = [
  { href: "/overview", label: "Overview" },
  { href: "/settings", label: "Settings" },
  { href: "/integrations", label: "Integrations" },
  { href: "/debug", label: "Debug" },
];

export function AdminShell({ email, children }: Props) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f4f0e8,_#e4ddcf_48%,_#d6cdb8)] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-8 lg:flex-row">
        <aside className="w-full rounded-[2rem] border border-stone-900/10 bg-stone-950 px-6 py-8 text-stone-100 shadow-2xl lg:w-72">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.4em] text-stone-400">Onyx</p>
            <h1 className="mt-2 text-3xl font-semibold">Priority Engine</h1>
            <p className="mt-3 text-sm text-stone-400">{email ?? "Authenticated founder"}</p>
          </div>
          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-full px-4 py-3 text-sm font-medium text-stone-200 transition hover:bg-stone-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <form action="/api/auth/logout" method="post" className="mt-8">
            <button
              type="submit"
              className="w-full rounded-full border border-stone-700 px-4 py-3 text-sm font-medium text-stone-300 transition hover:border-stone-500 hover:text-white"
            >
              Log out
            </button>
          </form>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
