import { ok } from "@/lib/utils/http";

export async function GET() {
  return ok({
    status: "ok",
    service: "onyx",
    timestamp: new Date().toISOString(),
  });
}
