import { AppShell } from "@/components/ui/app-shell";

type Props = {
  email?: string;
  children: React.ReactNode;
};

export function AdminShell({ email, children }: Props) {
  return <AppShell email={email}>{children}</AppShell>;
}
