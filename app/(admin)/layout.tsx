import { AdminShell } from "@/components/layout/admin-shell";
import { requireSession } from "@/lib/firebase/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();

  return <AdminShell email={session.email}>{children}</AdminShell>;
}
