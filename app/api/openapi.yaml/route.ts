import { NextResponse } from "next/server";

import { buildCanonicalOpenApiYaml } from "@/lib/gpt/openapi";

export async function GET() {
  return new NextResponse(buildCanonicalOpenApiYaml(), {
    status: 200,
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
    },
  });
}
