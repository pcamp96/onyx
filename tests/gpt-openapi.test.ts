import { describe, expect, it } from "vitest";

process.env.APP_URL = process.env.APP_URL ?? "https://onyx.example.com";
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "demo-project";
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL ?? "demo@example.com";
process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY ?? "private-key";
process.env.FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY ?? "web-api-key";
process.env.FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN ?? "demo.firebaseapp.com";
process.env.FIREBASE_APP_ID = process.env.FIREBASE_APP_ID ?? "app-id";
process.env.ONYX_ENCRYPTION_KEY = process.env.ONYX_ENCRYPTION_KEY ?? "test-encryption-key";

import { buildCanonicalOpenApiSpec, buildCanonicalOpenApiYaml } from "@/lib/gpt/openapi";

describe("canonical openapi schema", () => {
  it("includes only the intended GPT-facing endpoints and API key auth", () => {
    const schema = buildCanonicalOpenApiSpec();

    expect(schema.openapi).toBe("3.1.0");
    expect(schema.servers[0]?.url).toBe("https://onyx.example.com");
    expect(schema.servers[0]?.description?.toLowerCase()).toContain("externally reachable");
    expect(Object.keys(schema.paths)).toEqual([
      "/api/founder/today",
      "/api/founder/ideas",
      "/api/founder/week",
      "/api/founder/tlw/snapshot",
      "/api/founder/tlw/analytics",
      "/api/founder/tlw/overview",
      "/api/founder/capture",
    ]);
    expect(schema.components.securitySchemes.OnyxApiKey).toMatchObject({
      type: "apiKey",
      in: "header",
      name: "Authorization",
    });
    expect(schema.paths["/api/founder/today"].get.operationId).toBe("getFounderDailyPriorities");
    expect(schema.paths["/api/founder/ideas"].get.operationId).toBe("getFounderContentIdeas");
    expect(schema.paths["/api/founder/week"].get.operationId).toBe("getFounderWeeklyOverview");
    expect(schema.paths["/api/founder/tlw/snapshot"].get.operationId).toBe("getFounderTlwSnapshot");
    expect(schema.paths["/api/founder/tlw/analytics"].get.operationId).toBe("getFounderTlwAnalytics");
    expect(schema.paths["/api/founder/tlw/overview"].get.operationId).toBe("getFounderTlwOverview");
    expect(schema.paths["/api/founder/capture"].post["x-openai-isConsequential"]).toBe(true);
    expect(schema.components.schemas.TodayPlanResponse.additionalProperties).toBe(false);
    expect(schema.components.schemas.TodayPlanResponse.required).not.toContain("rankedTasks");
    expect(schema.components.schemas.TodayPlanResponse.properties.priorityTasks.items.$ref).toBe("#/components/schemas/RankedTaskPreview");
    expect(schema.components.schemas.TodayPlanResponse.properties.tomorrowTasks.items.$ref).toBe("#/components/schemas/RankedTaskPreview");
    expect(schema.components.schemas.TodayPlanResponse.properties.otherTasksRemainingCount.type).toBe("integer");
    expect(schema.components.schemas.TodayPlanResponse.properties.tlwOperatorPlan.$ref).toBe("#/components/schemas/TlwOperatorPlan");
    expect(schema.components.schemas.WeekPlanResponse.properties.areaPriorities.required).toEqual(["HTG", "TLW", "CREATED_WORKSHOP"]);
    expect(schema.components.schemas.WeekPlanResponse.properties.rankedPrioritiesRemainingCount.type).toBe("integer");
    expect(schema.components.schemas.IdeasPlanResponse.properties.rankedContextRemainingCount.type).toBe("integer");
    expect(schema.components.schemas.RankedTask.properties.sourceUrl.format).toBe("uri");
  });

  it("renders a yaml version for direct paste into custom actions", () => {
    const yaml = buildCanonicalOpenApiYaml();

    expect(yaml).toContain("openapi: 3.1.0");
    expect(yaml).toContain("/api/founder/today:");
    expect(yaml).toContain("/api/founder/tlw/overview:");
    expect(yaml).toContain("name: Authorization");
  });
});
