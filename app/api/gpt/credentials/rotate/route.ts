import { ok, unauthorized } from "@/lib/utils/http";
import { getGptSetupData, rotateGptCredential } from "@/lib/gpt/service";
import { requireApiSession } from "@/lib/utils/auth";

export async function POST() {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const result = await rotateGptCredential(session.uid);

  return ok({
    token: result.token,
    setup: await getGptSetupData(session.uid),
  });
}
