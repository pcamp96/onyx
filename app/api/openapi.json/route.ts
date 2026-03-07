import { ok } from "@/lib/utils/http";
import { buildCanonicalOpenApiSpec } from "@/lib/gpt/openapi";

export async function GET() {
  return ok(buildCanonicalOpenApiSpec());
}
