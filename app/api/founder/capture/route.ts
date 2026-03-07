import { NextRequest } from "next/server";

import { capturedItemsRepository } from "@/lib/firebase/repositories/captured-items";
import { requireFounderApiAccess } from "@/lib/utils/auth";
import { badRequest, created, unauthorized } from "@/lib/utils/http";

export async function POST(request: NextRequest) {
  const session = await requireFounderApiAccess(request);
  if (!session) {
    return unauthorized();
  }

  const body = (await request.json()) as { text?: string };
  if (!body.text?.trim()) {
    return badRequest("Text is required");
  }

  const item = await capturedItemsRepository.create({
    userId: session.uid,
    text: body.text.trim(),
    source: "api",
    status: "open",
    createdBy: session.uid,
  });

  return created(item);
}
