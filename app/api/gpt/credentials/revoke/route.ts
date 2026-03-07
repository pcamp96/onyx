import { ok, unauthorized } from "@/lib/utils/http";
import { getGptSetupData, revokeActiveGptCredential } from "@/lib/gpt/service";
import { requireApiSession } from "@/lib/utils/auth";

export async function POST() {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  await revokeActiveGptCredential(session.uid);

  return ok({
    setup: await getGptSetupData(session.uid),
  });
}
