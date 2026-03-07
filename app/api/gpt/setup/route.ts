import { getGptSetupData } from "@/lib/gpt/service";
import { requireApiSession } from "@/lib/utils/auth";
import { ok, unauthorized } from "@/lib/utils/http";

export async function GET() {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  return ok(await getGptSetupData(session.uid));
}
