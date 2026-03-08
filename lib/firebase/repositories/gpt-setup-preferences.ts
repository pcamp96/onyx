import { nowIso, toPlainObject, userDocument } from "@/lib/firebase/repositories/base";
import type { GptSetupPreferences } from "@/lib/gpt/types";

const SUBCOLLECTION = "gpt_setup_preferences";
const DEFAULT_ID = "default";

function preferencesRef(userId: string) {
  return userDocument(userId).collection(SUBCOLLECTION).doc(DEFAULT_ID);
}

function normalizeList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const entries = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return entries.length ? entries : fallback;
}

function normalizePreferences(
  userId: string,
  input: Partial<GptSetupPreferences> | null | undefined,
  updatedBy: string,
  displayName?: string,
): GptSetupPreferences {
  const defaults = buildDefaultGptSetupPreferences(userId, updatedBy, displayName);
  const projectLabels: Partial<GptSetupPreferences["projectLabels"]> = input?.projectLabels ?? {};

  return {
    ...defaults,
    ...input,
    id: DEFAULT_ID,
    userId,
    assistantName: typeof input?.assistantName === "string" && input.assistantName.trim() ? input.assistantName : defaults.assistantName,
    userDisplayName:
      typeof input?.userDisplayName === "string" && input.userDisplayName.trim() ? input.userDisplayName : defaults.userDisplayName,
    roleDescription:
      typeof input?.roleDescription === "string" && input.roleDescription.trim() ? input.roleDescription : defaults.roleDescription,
    jobDescription:
      typeof input?.jobDescription === "string" && input.jobDescription.trim() ? input.jobDescription : defaults.jobDescription,
    toneRules: normalizeList(input?.toneRules, defaults.toneRules),
    responseStyleRules: normalizeList(input?.responseStyleRules, defaults.responseStyleRules),
    priorityRules: normalizeList(input?.priorityRules, defaults.priorityRules),
    toolRules: normalizeList(input?.toolRules, defaults.toolRules),
    contentRules: normalizeList(input?.contentRules, defaults.contentRules),
    externalApiRules: normalizeList(input?.externalApiRules, defaults.externalApiRules),
    constraints: normalizeList(input?.constraints, defaults.constraints),
    projectLabels: {
      htg: typeof projectLabels.htg === "string" && projectLabels.htg.trim() ? projectLabels.htg : defaults.projectLabels.htg,
      tlw: typeof projectLabels.tlw === "string" && projectLabels.tlw.trim() ? projectLabels.tlw : defaults.projectLabels.tlw,
      createdWorkshop:
        typeof projectLabels.createdWorkshop === "string" && projectLabels.createdWorkshop.trim()
          ? projectLabels.createdWorkshop
          : defaults.projectLabels.createdWorkshop,
    },
    maxTasks:
      typeof input?.maxTasks === "number" && Number.isFinite(input.maxTasks) && input.maxTasks > 0
        ? input.maxTasks
        : defaults.maxTasks,
    maxMarketingActions:
      typeof input?.maxMarketingActions === "number" && Number.isFinite(input.maxMarketingActions) && input.maxMarketingActions >= 0
        ? input.maxMarketingActions
        : defaults.maxMarketingActions,
    customInstructionsAppendix:
      typeof input?.customInstructionsAppendix === "string" ? input.customInstructionsAppendix : defaults.customInstructionsAppendix,
    updatedAt: typeof input?.updatedAt === "string" && input.updatedAt ? input.updatedAt : defaults.updatedAt,
    updatedBy: typeof input?.updatedBy === "string" && input.updatedBy ? input.updatedBy : updatedBy,
  };
}

export function buildDefaultGptSetupPreferences(userId: string, updatedBy: string, displayName?: string): GptSetupPreferences {
  const timestamp = nowIso();

  return {
    id: DEFAULT_ID,
    userId,
    assistantName: "Onyx",
    userDisplayName: displayName || "the user",
    roleDescription: "execution operator",
    jobDescription: "Turn live Onyx priorities into clear next actions and reduce decision fatigue.",
    toneRules: ["Direct.", "Concise.", "Operator mindset.", "Prefer bullets.", "Clarity -> Action -> Momentum."],
    responseStyleRules: [
      "Lead with the next best action.",
      "Keep answers concise, operational, and execution-focused.",
      "When useful, show top priorities, the remaining due or overdue workload, why the priorities matter, and key risks.",
    ],
    priorityRules: [
      "Preserve ranked order from the API exactly.",
      "HTG usually comes first.",
      "TLW usually comes second.",
      "Created Workshop rises only when sponsor pressure or a real deadline makes it urgent.",
    ],
    toolRules: [
      "Use /today for immediate execution questions.",
      "Use /week for weekly pace, weekly priorities, and deadline risk.",
      "Use /capture only when the user explicitly asks to save something.",
    ],
    contentRules: [
      "Use /today for near-term content prompts tied to current execution.",
      "Use /week for broader weekly themes.",
      "Use contentPrompts when present.",
      "Exclude HTG from content, build-in-public, and marketing ideas. HTG is a writing gig, not a public-facing growth surface.",
      "Keep content ideas secondary to execution priorities unless the user explicitly asks only for content ideas.",
    ],
    externalApiRules: [
      "Use the TLW metrics endpoints only when the user asks about The Laser Workshop, growth, marketing, or product traction.",
      "Use /api/founder/tlw/overview as the default TLW metrics call.",
      "Use /api/founder/tlw/analytics for traffic-source or activation questions.",
      "Use /api/founder/tlw/snapshot for raw TLW counts and growth-stage questions.",
      "Interpret TLW metrics using growth thinking: user growth indicates acquisition health, settings velocity indicates supply health, activation rate indicates onboarding health, and conversion indicates monetization health.",
      "Never ask the user for the TLW token. TLW auth should be configured server-side through Integrations.",
    ],
    constraints: [
      "Onyx is a priority engine, not a scheduler.",
      "Treat calendar as a constraint, not the planning engine.",
      "Do not invent unsupported actions or endpoints.",
      "Do not call write actions for read-only questions.",
      "Do not ask for tokens or secrets.",
    ],
    projectLabels: {
      htg: "HTG",
      tlw: "TLW",
      createdWorkshop: "Created Workshop",
    },
    maxTasks: 3,
    maxMarketingActions: 1,
    customInstructionsAppendix: "",
    updatedAt: timestamp,
    updatedBy,
  };
}

export const gptSetupPreferencesRepository = {
  async get(userId: string, displayName?: string): Promise<GptSetupPreferences> {
    const snapshot = await preferencesRef(userId).get();
    if (!snapshot.exists) {
      return buildDefaultGptSetupPreferences(userId, userId, displayName);
    }

    return normalizePreferences(
      userId,
      toPlainObject(snapshot.data() as unknown as Partial<GptSetupPreferences>),
      userId,
      displayName,
    );
  },

  async save(
    userId: string,
    input: Partial<GptSetupPreferences> & { updatedBy: string },
    displayName?: string,
  ): Promise<GptSetupPreferences> {
    const current = await this.get(userId, displayName);
    const payload = normalizePreferences(
      userId,
      {
        ...current,
        ...input,
        updatedAt: nowIso(),
        updatedBy: input.updatedBy,
      },
      input.updatedBy,
      displayName,
    );

    await preferencesRef(userId).set(payload, { merge: true });
    return payload;
  },
};
