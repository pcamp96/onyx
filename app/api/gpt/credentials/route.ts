import { conflict, created, unauthorized } from "@/lib/utils/http";
import { createInitialGptCredential, getGptSetupData } from "@/lib/gpt/service";
import { requireApiSession } from "@/lib/utils/auth";

export async function POST() {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const result = await createInitialGptCredential(session.uid);
  if (!result.token) {
    return conflict("An active GPT API key already exists. Rotate it instead.");
  }

  return created({
    token: result.token,
    setup: await getGptSetupData(session.uid),
  });
}
