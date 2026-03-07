import { integrationsRepository } from "@/lib/firebase/repositories/integrations";
import { requireApiSession } from "@/lib/utils/auth";
import { ok, unauthorized } from "@/lib/utils/http";

export async function GET() {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const integrations = await integrationsRepository.list();
  return ok(integrations);
}
