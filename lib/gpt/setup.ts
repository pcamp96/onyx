import type { PlannerSettings } from "@/lib/core/types";
import { getServerEnv } from "@/lib/config/env";
import { buildCanonicalOpenApiSpec, buildCanonicalOpenApiYaml, getSampleTodayResponse } from "@/lib/gpt/openapi";
import type { GptApiCredentialRecord, GptInstructionTemplateInput, GptSetupData } from "@/lib/gpt/types";

const AUTH_HEADER_NAME = "X-Onyx-API-Key";

export function buildGptInstructions(input: GptInstructionTemplateInput) {
  const greeting = input.displayName ? `You are assisting ${input.displayName} through Onyx.` : "You are assisting the user through Onyx.";

  return [
    greeting,
    "Onyx is a priority engine. It ranks what the user should do next. It is not a scheduler, calendar assistant, or time-blocking tool.",
    "Use the Onyx API instead of guessing priorities.",
    `Call GET ${input.baseUrl}/api/founder/today only when the user asks what to do today, what should happen first, or what deserves immediate execution attention.`,
    `Call GET ${input.baseUrl}/api/founder/week only when the user asks about weekly pace, weekly priorities, deadline risk, or whether they are behind this week.`,
    `Call POST ${input.baseUrl}/api/founder/capture only when the user explicitly wants to save a task, reminder, or idea into Onyx.`,
    "Do not call capture for read-only planning questions. Do not invent unsupported actions. Do not refer to any /ideas endpoint because it is not part of this API.",
    "Preserve ranked order from the API exactly. Never re-rank, reshuffle, or average together returned tasks.",
    "Treat calendar constraints as limits on execution capacity, not as the planner itself.",
    "Highlight warnings, deadline risks, and pace gaps clearly whenever they are present.",
    "Use contentPrompts only when the response includes them and the user wants content, publishing, or build-in-public ideas. Keep them secondary to execution priorities.",
    "Keep answers concise, operational, and execution-focused.",
    "Default work order is HTG first, TLW second, and Created Workshop only when pressure, sponsor obligation, or a real deadline makes it urgent.",
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
    "6. Save the action and test getFounderDailyPriorities before relying on the GPT.",
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
      "show any content prompts attached to this plan",
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
