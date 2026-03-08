import type { PlannerSettings } from "@/lib/core/types";
import { getServerEnv } from "@/lib/config/env";
import { buildCanonicalOpenApiSpec, buildCanonicalOpenApiYaml, getSampleTodayResponse } from "@/lib/gpt/openapi";
import type { GptApiCredentialRecord, GptInstructionTemplateInput, GptSetupData, GptSetupPreferences } from "@/lib/gpt/types";

const AUTH_HEADER_NAME = "Authorization";

export function buildGptInstructions(input: GptInstructionTemplateInput) {
  const { preferences } = input;
  const introLine = `You are ${preferences.assistantName}, ${preferences.userDisplayName}'s ${preferences.roleDescription}.`;
  const limitsLine =
    preferences.maxMarketingActions > 0
      ? `Constraints: Max ${preferences.maxTasks} tasks. Max ${preferences.maxMarketingActions} marketing or content action.`
      : `Constraints: Max ${preferences.maxTasks} tasks.`;
  const appendix = preferences.customInstructionsAppendix?.trim();

  return [
    introLine,
    `Your job: ${preferences.jobDescription}`,
    "Onyx is a priority engine. It ranks what the user should do next. It is not a scheduler, calendar assistant, or time-blocking tool.",
    section("Tone", preferences.toneRules),
    section("Response Style", preferences.responseStyleRules),
    section("Priority Rules", preferences.priorityRules),
    section("Tool Rules", [
      ...preferences.toolRules,
      "Use the Onyx API instead of guessing priorities.",
      `Call GET ${input.baseUrl}/api/founder/today when the user asks what to do today, what should happen first, or what deserves immediate execution attention. Use priorityTasks for the main day plan and otherTasks for the remaining actionable load.`,
      `Call GET ${input.baseUrl}/api/founder/ideas when the user explicitly wants content ideas, posting ideas, or build-in-public prompts tied to current work.`,
      `Call GET ${input.baseUrl}/api/founder/week when the user asks about weekly pace, weekly priorities, deadline risk, or whether they are behind this week.`,
      `Call POST ${input.baseUrl}/api/founder/capture only when the user explicitly wants to save a task, reminder, or idea into Onyx.`,
    ]),
    section("Content Rules", preferences.contentRules),
    section("Constraints", [
      ...preferences.constraints,
      "Preserve ranked order from the API exactly. Never re-rank, reshuffle, or average together returned tasks.",
      "For /today, lead with the first three items from priorityTasks, then surface the rest of otherTasks as lower-priority work that is still on deck.",
      "Treat calendar constraints as limits on execution capacity, not as the planner itself.",
      "Highlight warnings, deadline risks, and pace gaps clearly whenever they are present.",
    ]),
    `Project labels: ${preferences.projectLabels.htg}, ${preferences.projectLabels.tlw}, ${preferences.projectLabels.createdWorkshop}.`,
    limitsLine,
    `Authentication: ${input.authTypeLabel}. ${input.authNotes}`,
    `Action schema URL: ${input.schemaUrl}`,
    `Timezone context: ${input.timezone}.`,
    appendix ? `Additional instructions:\n${appendix}` : null,
  ].filter(Boolean).join("\n\n");
}

function buildAuthNotes() {
  return `Choose API Key auth in Custom GPT setup and send the generated token in the ${AUTH_HEADER_NAME} header. Use Bearer <token> unless the action importer asks for only the raw secret.`;
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
    "5. Use the generated Onyx API token as the action secret.",
    `6. ${params.authNotes}`,
    "7. Save the action and test getFounderDailyPriorities before relying on the GPT.",
  ].join("\n");
}

export function buildGptSetupData(params: {
  credential: GptApiCredentialRecord | null;
  settings: PlannerSettings;
  preferences: GptSetupPreferences;
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
    preferences: params.preferences,
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
      "/ideas",
      "/week",
      "capture: follow up with sponsor",
      "what should I do first today?",
      "what should I post today?",
      "what am I behind on this week?",
      "show any content prompts attached to this plan",
    ],
    checklist: [
      "Create a new Custom GPT in ChatGPT.",
      "Add a custom action and import the schema from the schema URL.",
      "Choose API Key auth and set the header name exactly to Authorization.",
      "Generate or rotate an Onyx GPT API key and paste it into the action auth field. Use Bearer <token> if ChatGPT expects a full Authorization header value.",
      "Paste the generated Onyx instructions into the GPT instructions field.",
      "Run /today and /ideas and confirm both the ranked task list and content prompts appear correctly.",
    ],
    sampleTodayResponse: getSampleTodayResponse(),
    preferences: params.preferences,
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

function section(title: string, lines: string[]) {
  return [title, ...lines].join("\n");
}
