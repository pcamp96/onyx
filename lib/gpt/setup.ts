import type { PlannerSettings } from "@/lib/core/types";
import { getServerEnv } from "@/lib/config/env";
import { buildCanonicalOpenApiSpec, buildCanonicalOpenApiYaml, getSampleTodayResponse } from "@/lib/gpt/openapi";
import type { GptApiCredentialRecord, GptInstructionTemplateInput, GptSetupData } from "@/lib/gpt/types";

const AUTH_HEADER_NAME = "X-Onyx-API-Key";

export function buildGptInstructions(input: GptInstructionTemplateInput) {
  const greeting = input.displayName ? `You are assisting ${input.displayName} through Onyx.` : "You are assisting the user through Onyx.";

  return [
    greeting,
    "Onyx is a priority engine that ranks what the user should do next. It is not a scheduler or time-blocking system.",
    "Use the Onyx API instead of guessing priorities whenever the user asks what to do today, what matters this week, or whether they are behind.",
    `Use GET ${input.baseUrl}/api/founder/today when the user asks what to do today. Preserve the ranked task order exactly as returned.`,
    `Use GET ${input.baseUrl}/api/founder/week when the user asks about weekly pace, priorities, bottlenecks, or deadline risk.`,
    `Use POST ${input.baseUrl}/api/founder/capture when the user explicitly wants to save a task, reminder, or idea into Onyx.`,
    "Do not invent a new priority order when Onyx has already ranked the work.",
    "Keep responses concise, execution-focused, and action-oriented.",
    "Highlight warnings, deadlines, and pace gaps clearly.",
    "Treat calendar events as constraints, not as the planning engine.",
    "Default priority order is HTG first, TLW second, and Created Workshop only when pressure, deadline, or sponsor obligation makes it urgent.",
    `Authentication: ${input.authTypeLabel}. ${input.authNotes}`,
    `Action schema URL: ${input.schemaUrl}`,
    `Timezone context: ${input.timezone}.`,
  ].join("\n\n");
}

function buildAuthNotes() {
  return `Choose API Key auth in Custom GPT setup and send the generated token in the ${AUTH_HEADER_NAME} header.`;
}

function buildActionInstructions(params: {
  schemaUrl: string;
  schemaYamlUrl: string;
  authHeaderName: string;
  authNotes: string;
}) {
  return [
    "Use these instructions for the Custom GPT action itself.",
    `1. In the GPT editor, add a new custom action and import the schema from ${params.schemaUrl}.`,
    `2. If URL import is unavailable or you want to inspect it first, use the YAML version from ${params.schemaYamlUrl}.`,
    "3. Choose API Key authentication for the action.",
    `4. Set the auth header name exactly to ${params.authHeaderName}.`,
    `5. Paste the generated Onyx API token as the action secret. ${params.authNotes}`,
    "6. Save the action and test getFounderTodayPlan before relying on the GPT.",
  ].join("\n");
}

export function buildGptSetupData(params: {
  credential: GptApiCredentialRecord | null;
  settings: PlannerSettings;
  displayName?: string;
}): GptSetupData {
  const { APP_URL } = getServerEnv();
  const baseUrl = APP_URL.replace(/\/$/, "");
  const schemaUrl = `${baseUrl}/api/openapi.json`;
  const schemaYamlUrl = `${baseUrl}/api/openapi.yaml`;
  const authNotes = buildAuthNotes();
  const actionSchemaJson = JSON.stringify(buildCanonicalOpenApiSpec(), null, 2);
  const actionSchemaYaml = buildCanonicalOpenApiYaml();

  const instructions = buildGptInstructions({
    baseUrl,
    schemaUrl,
    authHeaderName: AUTH_HEADER_NAME,
    authTypeLabel: "API Key",
    authNotes,
    timezone: params.settings.timezone,
    displayName: params.displayName,
  });

  return {
    baseUrl,
    schemaUrl,
    schemaYamlUrl,
    authType: "API Key",
    authHeaderName: AUTH_HEADER_NAME,
    authNotes,
    actionInstructions: buildActionInstructions({
      schemaUrl,
      schemaYamlUrl,
      authHeaderName: AUTH_HEADER_NAME,
      authNotes,
    }),
    actionSchemaJson,
    actionSchemaYaml,
    instructions,
    conversationStarters: [
      "/today",
      "/week",
      "capture: follow up with sponsor",
      "what should I do first today?",
      "what am I behind on this week?",
    ],
    checklist: [
      "Create a new Custom GPT in ChatGPT.",
      "Add a custom action and import the schema from the schema URL.",
      "Choose API Key auth and set the header name exactly to X-Onyx-API-Key.",
      "Generate or rotate an Onyx GPT API key and paste it into the action auth field.",
      "Paste the generated Onyx instructions into the GPT instructions field.",
      "Run /today and confirm the ranked task list and warnings appear correctly.",
    ],
    sampleTodayResponse: getSampleTodayResponse(),
    credential: params.credential
      ? {
          label: params.credential.label,
          status: params.credential.status,
          tokenLastFour: params.credential.tokenLastFour,
          createdAt: params.credential.createdAt,
          updatedAt: params.credential.updatedAt,
          lastUsedAt: params.credential.lastUsedAt,
          revokedAt: params.credential.revokedAt,
        }
      : {
          label: "Custom GPT",
          status: "missing",
        },
  };
}
